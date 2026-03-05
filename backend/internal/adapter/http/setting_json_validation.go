package http

import (
	"encoding/json"
	"fmt"
	"strings"
	"xiaoheiplay/internal/domain"
)

func validateSettingJSONValue(key, value string) error {
	if !isLikelyJSONSettingKey(key) {
		return nil
	}
	raw := strings.TrimSpace(value)
	if raw == "" {
		return nil
	}
	if isDoubleEncodedContainerJSON(raw) {
		return fmt.Errorf("%w: setting %s contains double-encoded json", domain.ErrInvalidInput, key)
	}
	if !json.Valid([]byte(raw)) {
		return fmt.Errorf("%w: setting %s expects valid json", domain.ErrInvalidInput, key)
	}
	var decoded any
	if err := json.Unmarshal([]byte(raw), &decoded); err != nil {
		return fmt.Errorf("%w: setting %s expects valid json", domain.ErrInvalidInput, key)
	}
	switch decoded.(type) {
	case map[string]any, []any:
		return nil
	default:
		return fmt.Errorf("%w: setting %s expects json object/array", domain.ErrInvalidInput, key)
	}
}

func isDoubleEncodedContainerJSON(raw string) bool {
	var nested string
	if err := json.Unmarshal([]byte(raw), &nested); err != nil {
		return false
	}
	nested = strings.TrimSpace(nested)
	if nested == "" {
		return false
	}
	if !json.Valid([]byte(nested)) {
		return false
	}
	var decoded any
	if err := json.Unmarshal([]byte(nested), &decoded); err != nil {
		return false
	}
	switch decoded.(type) {
	case map[string]any, []any:
		return true
	default:
		return false
	}
}
