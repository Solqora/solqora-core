package service

import (
	"fmt"
	"strings"

	"github.com/solqora/solqora-core/common"
	"github.com/solqora/solqora-core/dto"
	"github.com/solqora/solqora-core/model"
	"github.com/solqora/solqora-core/setting/operation_setting"
	"github.com/solqora/solqora-core/types"
)

func formatNotifyType(channelId int, status int) string {
	return fmt.Sprintf("%s_%d_%d", dto.NotifyTypeChannelUpdate, channelId, status)
}

// disable & notify
func DisableChannel(channelError types.ChannelError, reason string) {
	common.SysLog(fmt.Sprintf("%s#%d%s", channelError.ChannelName, channelError.ChannelId, common.LocalLogPreview(reason)))

	// 
	if !channelError.AutoBan {
		common.SysLog(fmt.Sprintf("%s#%d", channelError.ChannelName, channelError.ChannelId))
		return
	}

	success := model.UpdateChannelStatus(channelError.ChannelId, channelError.UsingKey, common.ChannelStatusAutoDisabled, reason)
	if success {
		subject := fmt.Sprintf("%s#%d", channelError.ChannelName, channelError.ChannelId)
		content := fmt.Sprintf("%s#%d%s", channelError.ChannelName, channelError.ChannelId, reason)
		NotifyRootUser(formatNotifyType(channelError.ChannelId, common.ChannelStatusAutoDisabled), subject, content)
	}
}

func EnableChannel(channelId int, usingKey string, channelName string) {
	success := model.UpdateChannelStatus(channelId, usingKey, common.ChannelStatusEnabled, "")
	if success {
		subject := fmt.Sprintf("%s#%d", channelName, channelId)
		content := fmt.Sprintf("%s#%d", channelName, channelId)
		NotifyRootUser(formatNotifyType(channelId, common.ChannelStatusEnabled), subject, content)
	}
}

func ShouldDisableChannel(err *types.solqoraError) bool {
	if !common.AutomaticDisableChannelEnabled {
		return false
	}
	if err == nil {
		return false
	}
	if types.IsChannelError(err) {
		return true
	}
	if types.IsSkipRetryError(err) {
		return false
	}
	if operation_setting.ShouldDisableByStatusCode(err.StatusCode) {
		return true
	}

	lowerMessage := strings.ToLower(err.Error())
	search, _ := AcSearch(lowerMessage, operation_setting.AutomaticDisableKeywords, true)
	return search
}

func ShouldEnableChannel(solqoraError *types.solqoraError, status int) bool {
	if !common.AutomaticEnableChannelEnabled {
		return false
	}
	if solqoraError != nil {
		return false
	}
	if status != common.ChannelStatusAutoDisabled {
		return false
	}
	return true
}
