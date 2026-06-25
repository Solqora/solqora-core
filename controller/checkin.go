package controller

import (
	"fmt"
	"net/http"
	"time"

	"github.com/solqora/solqora-core/common"
	"github.com/solqora/solqora-core/logger"
	"github.com/solqora/solqora-core/model"
	"github.com/solqora/solqora-core/setting/operation_setting"
	"github.com/gin-gonic/gin"
)

// GetCheckinStatus 
func GetCheckinStatus(c *gin.Context) {
	setting := operation_setting.GetCheckinSetting()
	if !setting.Enabled {
		common.ApiErrorMsg(c, "")
		return
	}
	userId := c.GetInt("id")
	// 
	month := c.DefaultQuery("month", time.Now().Format("2006-01"))

	stats, err := model.GetUserCheckinStats(userId, month)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"enabled":   setting.Enabled,
			"min_quota": setting.MinQuota,
			"max_quota": setting.MaxQuota,
			"stats":     stats,
		},
	})
}

// DoCheckin 
func DoCheckin(c *gin.Context) {
	setting := operation_setting.GetCheckinSetting()
	if !setting.Enabled {
		common.ApiErrorMsg(c, "")
		return
	}

	userId := c.GetInt("id")

	checkin, err := model.UserCheckin(userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	model.RecordLog(userId, model.LogTypeSystem, fmt.Sprintf(" %s", logger.LogQuota(checkin.QuotaAwarded)))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"quota_awarded": checkin.QuotaAwarded,
			"checkin_date":  checkin.CheckinDate},
	})
}
