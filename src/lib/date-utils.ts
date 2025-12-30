import { format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Convierte un timestamp UTC del backend a la zona horaria de Peru (UTC-5)
 * El backend devuelve fechas en formato ISO con Z (UTC), pero deberían interpretarse
 * como si fueran en zona horaria local de Peru
 */
export const parseUTCToLocalPeru = (dateString: string): Date => {
  // Crear fecha desde el string UTC
  const utcDate = new Date(dateString)
  
  // Restar 5 horas (diferencia entre UTC y Peru)
  // Peru es UTC-5, así que restamos 5 horas a la fecha UTC
  const peruDate = new Date(utcDate.getTime() - (5 * 60 * 60 * 1000))
  
  return peruDate
}

/**
 * Formatea una fecha para mostrar en la UI (dd/MM/yyyy HH:mm)
 * Convierte automáticamente de UTC a zona horaria local de Peru
 */
export const formatDateTimeForDisplay = (dateString: string | Date): string => {
  let dateObj: Date
  
  if (typeof dateString === 'string') {
    // Si es un string ISO con Z (UTC), convertir a Peru
    if (dateString.includes('Z')) {
      dateObj = parseUTCToLocalPeru(dateString)
    } else {
      dateObj = new Date(dateString)
    }
  } else {
    dateObj = dateString
  }
  
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: es })
}

/**
 * Formatea una fecha para mostrar solo la fecha (dd/MM/yyyy)
 */
export const formatDateForDisplay = (dateString: string | Date): string => {
  let dateObj: Date
  
  if (typeof dateString === 'string') {
    // Si es un string ISO con Z (UTC), convertir a Peru
    if (dateString.includes('Z')) {
      dateObj = parseUTCToLocalPeru(dateString)
    } else {
      dateObj = new Date(dateString)
    }
  } else {
    dateObj = dateString
  }
  
  return format(dateObj, 'dd/MM/yyyy', { locale: es })
}

/**
 * Formatea una fecha para enviar al backend (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Obtiene la fecha actual en la zona horaria local
 */
export const getTodayAsLocal = (): Date => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}
