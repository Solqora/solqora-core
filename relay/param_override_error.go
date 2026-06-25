package relay

import (
	relaycommon "github.com/solqora/solqora-core/relay/common"
	"github.com/solqora/solqora-core/types"
)

func solqoraErrorFromParamOverride(err error) *types.solqoraError {
	if fixedErr, ok := relaycommon.AsParamOverrideReturnError(err); ok {
		return relaycommon.solqoraErrorFromParamOverride(fixedErr)
	}
	return types.NewError(err, types.ErrorCodeChannelParamOverrideInvalid, types.ErrOptionWithSkipRetry())
}
