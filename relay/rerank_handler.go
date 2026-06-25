package relay

import (
	"fmt"
	"io"
	"net/http"

	"github.com/solqora/solqora-core/common"
	"github.com/solqora/solqora-core/dto"
	"github.com/solqora/solqora-core/logger"
	relaycommon "github.com/solqora/solqora-core/relay/common"
	"github.com/solqora/solqora-core/relay/helper"
	"github.com/solqora/solqora-core/service"
	"github.com/solqora/solqora-core/setting/model_setting"
	"github.com/solqora/solqora-core/types"

	"github.com/gin-gonic/gin"
)

func RerankHelper(c *gin.Context, info *relaycommon.RelayInfo) (solqoraError *types.solqoraError) {
	info.InitChannelMeta(c)

	rerankReq, ok := info.Request.(*dto.RerankRequest)
	if !ok {
		return types.NewErrorWithStatusCode(fmt.Errorf("invalid request type, expected dto.RerankRequest, got %T", info.Request), types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
	}

	request, err := common.DeepCopy(rerankReq)
	if err != nil {
		return types.NewError(fmt.Errorf("failed to copy request to ImageRequest: %w", err), types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
	}

	err = helper.ModelMappedHelper(c, info, request)
	if err != nil {
		return types.NewError(err, types.ErrorCodeChannelModelMappedError, types.ErrOptionWithSkipRetry())
	}

	adaptor := GetAdaptor(info.ApiType)
	if adaptor == nil {
		return types.NewError(fmt.Errorf("invalid api type: %d", info.ApiType), types.ErrorCodeInvalidApiType, types.ErrOptionWithSkipRetry())
	}
	adaptor.Init(info)

	var requestBody io.Reader
	if model_setting.GetGlobalSettings().PassThroughRequestEnabled || info.ChannelSetting.PassThroughBodyEnabled {
		storage, err := common.GetBodyStorage(c)
		if err != nil {
			return types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
		}
		requestBody = common.ReaderOnly(storage)
	} else {
		convertedRequest, err := adaptor.ConvertRerankRequest(c, info.RelayMode, *request)
		if err != nil {
			return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
		}
		relaycommon.AppendRequestConversionFromRequest(info, convertedRequest)
		jsonData, err := common.Marshal(convertedRequest)
		if err != nil {
			return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
		}

		// apply param override
		if len(info.ParamOverride) > 0 {
			jsonData, err = relaycommon.ApplyParamOverrideWithRelayInfo(jsonData, info)
			if err != nil {
				return solqoraErrorFromParamOverride(err)
			}
		}

		logger.LogDebug(c, "Rerank request body: %s", jsonData)
		body, size, closer, err := relaycommon.NewOutboundJSONBody(jsonData)
		if err != nil {
			return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
		}
		defer closer.Close()
		jsonData = nil
		info.UpstreamRequestBodySize = size
		requestBody = body
	}

	resp, err := adaptor.DoRequest(c, info, requestBody)
	if err != nil {
		return types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}

	statusCodeMappingStr := c.GetString("status_code_mapping")
	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		if httpResp.StatusCode != http.StatusOK {
			solqoraError = service.RelayErrorHandler(c.Request.Context(), httpResp, false)
			// reset status code 
			service.ResetStatusCode(solqoraError, statusCodeMappingStr)
			return solqoraError
		}
	}

	usage, solqoraError := adaptor.DoResponse(c, httpResp, info)
	if solqoraError != nil {
		// reset status code 
		service.ResetStatusCode(solqoraError, statusCodeMappingStr)
		return solqoraError
	}
	service.PostTextConsumeQuota(c, info, usage.(*dto.Usage), nil)
	return nil
}
