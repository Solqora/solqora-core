package controller

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/solqora/solqora-core/common"
	"github.com/solqora/solqora-core/model"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// Setup2FARequest 2FA
type Setup2FARequest struct {
	Code string `json:"code" binding:"required"`
}

// Verify2FARequest 2FA
type Verify2FARequest struct {
	Code string `json:"code" binding:"required"`
}

// Setup2FAResponse 2FA
type Setup2FAResponse struct {
	Secret      string   `json:"secret"`
	QRCodeData  string   `json:"qr_code_data"`
	BackupCodes []string `json:"backup_codes"`
}

// Setup2FA 2FA
func Setup2FA(c *gin.Context) {
	userId := c.GetInt("id")

	// 2FA
	existing, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if existing != nil && existing.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}

	// 2FA
	if existing != nil && !existing.IsEnabled {
		if err := existing.Delete(); err != nil {
			common.ApiError(c, err)
			return
		}
		existing = nil // nil
	}

	// 
	user, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	// TOTP
	key, err := common.GenerateTOTPSecret(user.Username)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		common.SysLog("TOTP: " + err.Error())
		return
	}

	// 
	backupCodes, err := common.GenerateBackupCodes()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		common.SysLog(": " + err.Error())
		return
	}

	// 
	qrCodeData := common.GenerateQRCodeData(key.Secret(), user.Username)

	// 2FA
	twoFA := &model.TwoFA{
		UserId:    userId,
		Secret:    key.Secret(),
		IsEnabled: false,
	}

	if existing != nil {
		// 
		twoFA.Id = existing.Id
		err = twoFA.Update()
	} else {
		// 
		err = twoFA.Create()
	}

	if err != nil {
		common.ApiError(c, err)
		return
	}

	// 
	if err := model.CreateBackupCodes(userId, backupCodes); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		common.SysLog(": " + err.Error())
		return
	}

	// 
	model.RecordLog(userId, model.LogTypeSystem, "")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "2FA",
		"data": Setup2FAResponse{
			Secret:      key.Secret(),
			QRCodeData:  qrCodeData,
			BackupCodes: backupCodes,
		},
	})
}

// Enable2FA 2FA
func Enable2FA(c *gin.Context) {
	var req Setup2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	userId := c.GetInt("id")

	// 2FA
	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}
	if twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}

	// TOTP
	cleanCode, err := common.ValidateNumericCode(req.Code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	if !common.ValidateTOTPCode(twoFA.Secret, cleanCode) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	// 2FA
	if err := twoFA.Enable(); err != nil {
		common.ApiError(c, err)
		return
	}

	// 
	model.RecordLog(userId, model.LogTypeSystem, "")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

// Disable2FA 2FA
func Disable2FA(c *gin.Context) {
	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	userId := c.GetInt("id")

	// 2FA
	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil || !twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}

	// TOTP
	cleanCode, err := common.ValidateNumericCode(req.Code)
	isValidTOTP := false
	isValidBackup := false

	if err == nil {
		// TOTP
		isValidTOTP, _ = twoFA.ValidateTOTPAndUpdateUsage(cleanCode)
	}

	if !isValidTOTP {
		// 
		isValidBackup, err = twoFA.ValidateBackupCodeAndUpdateUsage(req.Code)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	if !isValidTOTP && !isValidBackup {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	// 2FA
	if err := model.DisableTwoFA(userId); err != nil {
		common.ApiError(c, err)
		return
	}

	// 
	model.RecordLog(userId, model.LogTypeSystem, "")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
	})
}

// Get2FAStatus 2FA
func Get2FAStatus(c *gin.Context) {
	userId := c.GetInt("id")

	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	status := map[string]interface{}{
		"enabled": false,
		"locked":  false,
	}

	if twoFA != nil {
		status["enabled"] = twoFA.IsEnabled
		status["locked"] = twoFA.IsLocked()
		if twoFA.IsEnabled {
			// 
			backupCount, err := model.GetUnusedBackupCodeCount(userId)
			if err != nil {
				common.SysLog(": " + err.Error())
			} else {
				status["backup_codes_remaining"] = backupCount
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    status,
	})
}

// RegenerateBackupCodes 
func RegenerateBackupCodes(c *gin.Context) {
	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	userId := c.GetInt("id")

	// 2FA
	twoFA, err := model.GetTwoFAByUserId(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil || !twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}

	// TOTP
	cleanCode, err := common.ValidateNumericCode(req.Code)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}

	valid, err := twoFA.ValidateTOTPAndUpdateUsage(cleanCode)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	if !valid {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	// 
	backupCodes, err := common.GenerateBackupCodes()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		common.SysLog(": " + err.Error())
		return
	}

	// 
	if err := model.CreateBackupCodes(userId, backupCodes); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		common.SysLog(": " + err.Error())
		return
	}

	// 
	model.RecordLog(userId, model.LogTypeSystem, "")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": map[string]interface{}{
			"backup_codes": backupCodes,
		},
	})
}

// Verify2FALogin 2FA
func Verify2FALogin(c *gin.Context) {
	var req Verify2FARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	// pending
	session := sessions.Default(c)
	pendingUserId := session.Get("pending_user_id")
	if pendingUserId == nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}
	userId, ok := pendingUserId.(int)
	if !ok {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}
	// 
	user, err := model.GetUserById(userId, false)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	// 2FA
	twoFA, err := model.GetTwoFAByUserId(user.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if twoFA == nil || !twoFA.IsEnabled {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}

	// TOTP
	cleanCode, err := common.ValidateNumericCode(req.Code)
	isValidTOTP := false
	isValidBackup := false

	if err == nil {
		// TOTP
		isValidTOTP, _ = twoFA.ValidateTOTPAndUpdateUsage(cleanCode)
	}

	if !isValidTOTP {
		// 
		isValidBackup, err = twoFA.ValidateBackupCodeAndUpdateUsage(req.Code)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": err.Error(),
			})
			return
		}
	}

	if !isValidTOTP && !isValidBackup {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "",
		})
		return
	}

	// 2FApending
	session.Delete("pending_username")
	session.Delete("pending_user_id")
	session.Save()

	setupLogin(user, c)
}

// Admin2FAStats 2FA
func Admin2FAStats(c *gin.Context) {
	stats, err := model.GetTwoFAStats()
	if err != nil {
		common.ApiError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data":    stats,
	})
}

// AdminDisable2FA 2FA
func AdminDisable2FA(c *gin.Context) {
	userIdStr := c.Param("id")
	userId, err := strconv.Atoi(userIdStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "ID",
		})
		return
	}

	// 
	targetUser, err := model.GetUserById(userId, false)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	myRole := c.GetInt("role")
	if !canManageTargetRole(myRole, targetUser.Role) {
		c.JSON(http.StatusOK, gin.H{
			"success": false,
			"message": "2FA",
		})
		return
	}

	// 2FA
	if err := model.DisableTwoFA(userId); err != nil {
		if errors.Is(err, model.ErrTwoFANotEnabled) {
			c.JSON(http.StatusOK, gin.H{
				"success": false,
				"message": "2FA",
			})
			return
		}
		common.ApiError(c, err)
		return
	}

	recordManageAuditFor(c, userId, "user.2fa_disable", nil)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "2FA",
	})
}
