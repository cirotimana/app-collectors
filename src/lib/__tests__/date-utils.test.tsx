import {
  parseUTCToLocalPeru,
  formatDateTimeForDisplay,
  formatDateForDisplay,
  formatDateForAPI,
  getTodayAsLocal,
} from "@/lib/date-utils"

describe("date utils", () => {
  describe("parseUTCToLocalPeru", () => {
    it("convierte correctamente de UTC a hora Peru (UTC-5)", () => {
      // 10:00 UTC → 05:00 Peru
      const utcDate = "2024-01-01T10:00:00Z"

      const result = parseUTCToLocalPeru(utcDate)

      expect(result.getUTCFullYear()).toBe(2024)
      expect(result.getUTCHours()).toBe(5)
      expect(result.getUTCMinutes()).toBe(0)
    })
  })

  describe("formatDateTimeForDisplay", () => {
    it("formatea fecha ISO UTC correctamente para mostrar (dd/MM/yyyy HH:mm)", () => {
      const utcDate = "2024-01-01T10:00:00Z"

      const result = formatDateTimeForDisplay(utcDate)

      expect(result).toBe("01/01/2024 00:00")
    })

    it("formatea Date sin conversión UTC", () => {
      const date = new Date(2024, 0, 1, 8, 30) // local

      const result = formatDateTimeForDisplay(date)

      expect(result).toBe("01/01/2024 08:30")
    })
  })

  describe("formatDateForDisplay", () => {
    it("formatea fecha ISO UTC solo fecha (dd/MM/yyyy)", () => {
      const utcDate = "2024-01-01T10:00:00Z"

      const result = formatDateForDisplay(utcDate)

      expect(result).toBe("01/01/2024")
    })

    it("formatea Date solo fecha", () => {
      const date = new Date(2024, 5, 15)

      const result = formatDateForDisplay(date)

      expect(result).toBe("15/06/2024")
    })
  })

  describe("formatDateForAPI", () => {
    it("formatea fecha para enviar al backend (YYYY-MM-DD)", () => {
      const date = new Date(2024, 0, 9)

      const result = formatDateForAPI(date)

      expect(result).toBe("2024-01-09")
    })
  })

  describe("getTodayAsLocal", () => {
    it("retorna la fecha actual sin hora (00:00:00)", () => {
      const result = getTodayAsLocal()

      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })
})
