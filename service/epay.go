package service

import (
	"github.com/solqora/solqora-core/setting/operation_setting"
	"github.com/solqora/solqora-core/setting/system_setting"
)

func GetCallbackAddress() string {
	if operation_setting.CustomCallbackAddress == "" {
		return system_setting.ServerAddress
	}
	return operation_setting.CustomCallbackAddress
}
