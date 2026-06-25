package model

import (
	"errors"
	"fmt"
	"time"

	"github.com/solqora/solqora-core/common"

	"gorm.io/gorm"
)

// TwoFA 2FA
type TwoFA struct {
	Id             int            `json:"id" gorm:"primaryKey"`
	UserId         int            `json:"user_id" gorm:"unique;not null;index"`
	Secret         string         `json:"-" gorm:"type:varchar(255);not null"` // TOTP
	IsEnabled      bool           `json:"is_enabled"`
	FailedAttempts int            `json:"failed_attempts" gorm:"default:0"`
	LockedUntil    *time.Time     `json:"locked_until,omitempty"`
	LastUsedAt     *time.Time     `json:"last_used_at,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `json:"-" gorm:"index"`
}

// TwoFABackupCode 
type TwoFABackupCode struct {
	Id        int            `json:"id" gorm:"primaryKey"`
	UserId    int            `json:"user_id" gorm:"not null;index"`
	CodeHash  string         `json:"-" gorm:"type:varchar(255);not null"` // 
	IsUsed    bool           `json:"is_used"`
	UsedAt    *time.Time     `json:"used_at,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`
}

// GetTwoFAByUserId ID2FA
func GetTwoFAByUserId(userId int) (*TwoFA, error) {
	if userId == 0 {
		return nil, errors.New("ID")
	}

	var twoFA TwoFA
	err := DB.Where("user_id = ?", userId).First(&twoFA).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil // nil2FA
		}
		return nil, err
	}

	return &twoFA, nil
}

// IsTwoFAEnabled 2FA
func IsTwoFAEnabled(userId int) bool {
	twoFA, err := GetTwoFAByUserId(userId)
	if err != nil || twoFA == nil {
		return false
	}
	return twoFA.IsEnabled
}

// CreateTwoFA 2FA
func (t *TwoFA) Create() error {
	// 2FA
	existing, err := GetTwoFAByUserId(t.UserId)
	if err != nil {
		return err
	}
	if existing != nil {
		return errors.New("2FA")
	}

	// 
	var user User
	if err := DB.First(&user, t.UserId).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("")
		}
		return err
	}

	return DB.Create(t).Error
}

// Update 2FA
func (t *TwoFA) Update() error {
	if t.Id == 0 {
		return errors.New("2FAID")
	}
	return DB.Save(t).Error
}

// Delete 2FA
func (t *TwoFA) Delete() error {
	if t.Id == 0 {
		return errors.New("2FAID")
	}

	// 
	return DB.Transaction(func(tx *gorm.DB) error {
		// 
		if err := tx.Unscoped().Where("user_id = ?", t.UserId).Delete(&TwoFABackupCode{}).Error; err != nil {
			return err
		}

		// 2FA
		return tx.Unscoped().Delete(t).Error
	})
}

// ResetFailedAttempts 
func (t *TwoFA) ResetFailedAttempts() error {
	t.FailedAttempts = 0
	t.LockedUntil = nil
	return t.Update()
}

// IncrementFailedAttempts 
func (t *TwoFA) IncrementFailedAttempts() error {
	t.FailedAttempts++

	// 
	if t.FailedAttempts >= common.MaxFailAttempts {
		lockUntil := time.Now().Add(time.Duration(common.LockoutDuration) * time.Second)
		t.LockedUntil = &lockUntil
	}

	return t.Update()
}

// IsLocked 
func (t *TwoFA) IsLocked() bool {
	if t.LockedUntil == nil {
		return false
	}
	return time.Now().Before(*t.LockedUntil)
}

// CreateBackupCodes 
func CreateBackupCodes(userId int, codes []string) error {
	return DB.Transaction(func(tx *gorm.DB) error {
		// 
		if err := tx.Where("user_id = ?", userId).Delete(&TwoFABackupCode{}).Error; err != nil {
			return err
		}

		// 
		for _, code := range codes {
			hashedCode, err := common.HashBackupCode(code)
			if err != nil {
				return err
			}

			backupCode := TwoFABackupCode{
				UserId:   userId,
				CodeHash: hashedCode,
				IsUsed:   false,
			}

			if err := tx.Create(&backupCode).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

// ValidateBackupCode 
func ValidateBackupCode(userId int, code string) (bool, error) {
	if !common.ValidateBackupCode(code) {
		return false, errors.New("")
	}

	normalizedCode := common.NormalizeBackupCode(code)

	// 
	var backupCodes []TwoFABackupCode
	if err := DB.Where("user_id = ? AND is_used = false", userId).Find(&backupCodes).Error; err != nil {
		return false, err
	}

	// 
	for _, bc := range backupCodes {
		if common.ValidatePasswordAndHash(normalizedCode, bc.CodeHash) {
			// 
			now := time.Now()
			bc.IsUsed = true
			bc.UsedAt = &now

			if err := DB.Save(&bc).Error; err != nil {
				return false, err
			}

			return true, nil
		}
	}

	return false, nil
}

// GetUnusedBackupCodeCount 
func GetUnusedBackupCodeCount(userId int) (int, error) {
	var count int64
	err := DB.Model(&TwoFABackupCode{}).Where("user_id = ? AND is_used = false", userId).Count(&count).Error
	return int(count), err
}

// DisableTwoFA 2FA
func DisableTwoFA(userId int) error {
	twoFA, err := GetTwoFAByUserId(userId)
	if err != nil {
		return err
	}
	if twoFA == nil {
		return ErrTwoFANotEnabled
	}

	// 2FA
	return twoFA.Delete()
}

// EnableTwoFA 2FA
func (t *TwoFA) Enable() error {
	t.IsEnabled = true
	t.FailedAttempts = 0
	t.LockedUntil = nil
	return t.Update()
}

// ValidateTOTPAndUpdateUsage TOTP
func (t *TwoFA) ValidateTOTPAndUpdateUsage(code string) (bool, error) {
	// 
	if t.IsLocked() {
		return false, fmt.Errorf("%v", t.LockedUntil.Format("2006-01-02 15:04:05"))
	}

	// TOTP
	if !common.ValidateTOTPCode(t.Secret, code) {
		// 
		if err := t.IncrementFailedAttempts(); err != nil {
			common.SysLog("2FA: " + err.Error())
		}
		return false, nil
	}

	// 
	now := time.Now()
	t.FailedAttempts = 0
	t.LockedUntil = nil
	t.LastUsedAt = &now

	if err := t.Update(); err != nil {
		common.SysLog("2FA: " + err.Error())
	}

	return true, nil
}

// ValidateBackupCodeAndUpdateUsage 
func (t *TwoFA) ValidateBackupCodeAndUpdateUsage(code string) (bool, error) {
	// 
	if t.IsLocked() {
		return false, fmt.Errorf("%v", t.LockedUntil.Format("2006-01-02 15:04:05"))
	}

	// 
	valid, err := ValidateBackupCode(t.UserId, code)
	if err != nil {
		return false, err
	}

	if !valid {
		// 
		if err := t.IncrementFailedAttempts(); err != nil {
			common.SysLog("2FA: " + err.Error())
		}
		return false, nil
	}

	// 
	now := time.Now()
	t.FailedAttempts = 0
	t.LockedUntil = nil
	t.LastUsedAt = &now

	if err := t.Update(); err != nil {
		common.SysLog("2FA: " + err.Error())
	}

	return true, nil
}

// GetTwoFAStats 2FA
func GetTwoFAStats() (map[string]interface{}, error) {
	var totalUsers, enabledUsers int64

	// 
	if err := DB.Model(&User{}).Count(&totalUsers).Error; err != nil {
		return nil, err
	}

	// 2FA
	if err := DB.Model(&TwoFA{}).Where("is_enabled = true").Count(&enabledUsers).Error; err != nil {
		return nil, err
	}

	enabledRate := float64(0)
	if totalUsers > 0 {
		enabledRate = float64(enabledUsers) / float64(totalUsers) * 100
	}

	return map[string]interface{}{
		"total_users":   totalUsers,
		"enabled_users": enabledUsers,
		"enabled_rate":  fmt.Sprintf("%.1f%%", enabledRate),
	}, nil
}
