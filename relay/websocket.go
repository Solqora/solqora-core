package relay

import (
	"fmt"

	"github.com/solqora/solqora-core/dto"
	relaycommon "github.com/solqora/solqora-core/relay/common"
	"github.com/solqora/solqora-core/service"
	"github.com/solqora/solqora-core/types"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

func WssHelper(c *gin.Context, info *relaycommon.RelayInfo) (solqoraError *types.solqoraError) {
	info.InitChannelMeta(c)

	adaptor := GetAdaptor(info.ApiType)
	if adaptor == nil {
		return types.NewError(fmt.Errorf("invalid api type: %d", info.ApiType), types.ErrorCodeInvalidApiType, types.ErrOptionWithSkipRetry())
	}
	adaptor.Init(info)
	//var requestBody io.Reader
	//firstWssRequest, _ := c.Get("first_wss_request")
	//requestBody = bytes.NewBuffer(firstWssRequest.([]byte))

	statusCodeMappingStr := c.GetString("status_code_mapping")
	resp, err := adaptor.DoRequest(c, info, nil)
	if err != nil {
		return types.NewError(err, types.ErrorCodeDoRequestFailed)
	}

	if resp != nil {
		info.TargetWs = resp.(*websocket.Conn)
		defer info.TargetWs.Close()
	}

	usage, solqoraError := adaptor.DoResponse(c, nil, info)
	if solqoraError != nil {
		// reset status code 
		service.ResetStatusCode(solqoraError, statusCodeMappingStr)
		return solqoraError
	}
	service.PostWssConsumeQuota(c, info, info.UpstreamModelName, usage.(*dto.RealtimeUsage), "")
	return nil
}
