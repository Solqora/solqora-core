package middleware

import (
	"github.com/solqora/solqora-core/common"
	"github.com/solqora/solqora-core/service"
	"github.com/gin-gonic/gin"
)

// BodyStorageCleanup 
// /
func BodyStorageCleanup() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 
		c.Next()

		// 
		common.CleanupBodyStorage(c)

		// URL 
		service.CleanupFileSources(c)
	}
}
