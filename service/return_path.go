package service

import (
	"strings"

	"github.com/solqora/solqora-core/common"
	"github.com/solqora/solqora-core/setting/system_setting"
)

func PaymentReturnURL(suffix string) string {
	base := strings.TrimRight(system_setting.ServerAddress, "/")
	return base + common.ThemeAwarePath(suffix)
}
