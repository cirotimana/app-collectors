import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';
import { ConciliationReport, PaginatedResponse, ConciliatedRecord, NonConciliatedRecord } from '@/lib/api';

interface DashboardStats {
  totalCalimacoAmount: number;
  totalCollectorAmount: number;
  totalConciliatedCalimaco: number;
  totalConciliatedCollector: number;
  totalNoConciliatedCalimaco: number;
  totalNoConciliatedCollector: number;
  avgConciliationCalimaco: number;
  avgConciliationCollector: number;
  difference: number;
}

const COLLECTORS = [
  { id: 1, name: "Kashio" },
  { id: 2, name: "Monnet" },
  { id: 3, name: "Kushki" },
  { id: 4, name: "Niubiz" },
  { id: 5, name: "Yape" },
  { id: 6, name: "Nuvei" },
  { id: 7, name: "PagoEfectivo" },
  { id: 8, name: "Safetypay" },
  { id: 9, name: "Tupay" },
  { id: 10, name: "Prometeo" },
];

const getCollectorName = (id: number) => {
  return COLLECTORS.find(c => c.id === id)?.name || `Collector ${id}`;
};

const formatCurrency = (amount: number) => {
  return `S/. ${amount.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDateToLocal = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    return format(date, "dd/MM/yyyy HH:mm:ss");
  } catch (e) {
    return dateStr;
  }
};

export const generateExcelReport = (
  stats: DashboardStats,
  reportsData: PaginatedResponse<ConciliationReport>
) => {
  const wb = XLSX.utils.book_new();
  const wsData: any[][] = [];

  // 1. general statistics
  wsData.push(["ESTADISTICAS GENERALES"]);
  wsData.push(["Concepto", "Monto / Valor"]);
  wsData.push(["Total Calimaco", formatCurrency(stats.totalCalimacoAmount)]);
  wsData.push(["Total Recaudador", formatCurrency(stats.totalCollectorAmount)]);
  wsData.push(["Diferencia", formatCurrency(stats.difference)]);
  wsData.push(["Conciliado Calimaco", formatCurrency(stats.totalConciliatedCalimaco)]);
  wsData.push(["Conciliado Recaudador", formatCurrency(stats.totalConciliatedCollector)]);
  wsData.push(["No Conciliado Calimaco", formatCurrency(stats.totalNoConciliatedCalimaco)]);
  wsData.push(["No Conciliado Recaudador", formatCurrency(stats.totalNoConciliatedCollector)]);
  wsData.push(["% Conciliacion Calimaco", `${stats.avgConciliationCalimaco.toFixed(2)}%`]);
  wsData.push(["% Conciliacion Recaudador", `${stats.avgConciliationCollector.toFixed(2)}%`]);
  wsData.push([]); // empty line
  wsData.push([]); // empty line

  // Helper to get rows for a table
  const getTableRows = (title: string, data: ConciliationReport[], valueField: keyof ConciliationReport) => {
    const rows: any[][] = [];
    rows.push([title.toUpperCase()]);
    rows.push(["Fecha", "Recaudador", "Monto"]);
    
    data.forEach(record => {
      rows.push([
        format(new Date(record.report_fecha), "dd/MM/yyyy"),
        getCollectorName(record.report_collector_id),
        formatCurrency(parseFloat(record[valueField] as string))
      ]);
    });
    
    const total = data.reduce((sum, r) => sum + parseFloat(r[valueField] as string), 0);
    rows.push(["TOTAL", "", formatCurrency(total)]);
    return rows;
  };

  // Generate data for all 4 tables
  const table1 = getTableRows("DETALLE MONTO CALIMACO", reportsData.data, 'monto_total_calimaco');
  const table2 = getTableRows("DETALLE MONTO RECAUDADOR", reportsData.data, 'monto_total_collector');
  const table3 = getTableRows("DETALLE NO CONCILIADO CALIMACO", reportsData.data, 'monto_no_conciliado_calimaco');
  const table4 = getTableRows("DETALLE NO CONCILIADO RECAUDADOR", reportsData.data, 'monto_no_conciliado_collector');

  // Function to merge two tables side-by-side
  const mergeTables = (leftTable: any[][], rightTable: any[][], gap: number = 2) => {
    const maxRows = Math.max(leftTable.length, rightTable.length);
    const merged: any[][] = [];

    for (let i = 0; i < maxRows; i++) {
      const leftRow = leftTable[i] || ["", "", ""];
      const rightRow = rightTable[i] || ["", "", ""];
      const gapCells = Array(gap).fill("");
      merged.push([...leftRow, ...gapCells, ...rightRow]);
    }
    return merged;
  };

  // Merge Table 1 and Table 2
  const rowSet1 = mergeTables(table1, table2);
  rowSet1.forEach(row => wsData.push(row));
  
  wsData.push([]); // spacer
  wsData.push([]); // spacer

  // Merge Table 3 and Table 4
  const rowSet2 = mergeTables(table3, table4);
  rowSet2.forEach(row => wsData.push(row));

  // create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // column widths
  const wscols = [
    { wch: 15 }, // A (Fecha)
    { wch: 20 }, // B (Recaudador)
    { wch: 20 }, // C (Monto)
    { wch: 5 },  // D (Gap)
    { wch: 5 },  // E (Gap)
    { wch: 15 }, // F (Fecha)
    { wch: 20 }, // G (Recaudador)
    { wch: 20 }, // H (Monto)
  ];
  ws['!cols'] = wscols;

  XLSX.utils.book_append_sheet(wb, ws, "Reporte Ventas");

  // generate file
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  
  saveAs(data, `reporte_ventas_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
};

export const generateConciliationReportExcel = (
  data: ConciliationReport[],
  conciliatedRecords: ConciliatedRecord[] = [],
  nonConciliatedRecords: NonConciliatedRecord[] = []
) => {
  const wb = XLSX.utils.book_new();
  
  // 1. Resumen (Existing logic)
  const wsData = [
    [
      "Fecha",
      "Recaudador",
      "Aprobados Calimaco",
      "Conciliados Calimaco",
      "No Conciliados Calimaco",
      "% Conciliado Calimaco",
      "% No Conciliado Calimaco",
      "Monto Total Calimaco",
      "Monto Conciliado Calimaco",
      "Monto No Conciliado Calimaco",
      "% Monto Conciliado Calimaco",
      "% Monto No Conciliado Calimaco",
      "Aprobados Recaudador",
      "Conciliados Recaudador",
      "No Conciliados Recaudador",
      "% Conciliado Recaudador",
      "% No Conciliado Recaudador",
      "Monto Total Recaudador",
      "Monto Conciliado Recaudador",
      "Monto No Conciliado Recaudador",
      "% Monto Conciliado Recaudador",
      "% Monto No Conciliado Recaudador"
    ]
  ];

  data.forEach(record => {
    wsData.push([
      format(new Date(record.report_fecha), "dd/MM/yyyy"),
      getCollectorName(record.report_collector_id),
      record.aprobados_calimaco.toString(),
      record.conciliados_calimaco.toString(),
      record.no_conciliados_calimaco.toString(),
      `${record.porcentaje_conciliado_calimaco}%`,
      `${record.porcentaje_no_conciliado_calimaco}%`,
      formatCurrency(parseFloat(record.monto_total_calimaco)),
      formatCurrency(parseFloat(record.monto_conciliado_calimaco)),
      formatCurrency(parseFloat(record.monto_no_conciliado_calimaco)),
      `${record.porcentaje_monto_conciliado_calimaco}%`,
      `${record.porcentaje_monto_no_conciliado_calimaco}%`,
      record.aprobados_collector.toString(),
      record.conciliados_collector.toString(),
      record.no_conciliados_collector.toString(),
      `${record.porcentaje_conciliado_collector}%`,
      `${record.porcentaje_no_conciliado_collector}%`,
      formatCurrency(parseFloat(record.monto_total_collector)),
      formatCurrency(parseFloat(record.monto_conciliado_collector)),
      formatCurrency(parseFloat(record.monto_no_conciliado_collector)),
      `${record.porcentaje_monto_conciliado_collector}%`,
      `${record.porcentaje_monto_no_conciliado_collector}%`
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wscols = wsData[0].map(() => ({ wch: 20 }));
  ws['!cols'] = wscols;
  XLSX.utils.book_append_sheet(wb, ws, "Resumen");

  // Helper to split data into chunks of 1M rows
  const CHUNK_SIZE = 1000000;

  // 2. Conciliados
  if (conciliatedRecords.length > 0) {
    const conciliatedHeaders = [
      "ID Calimaco", "ID Recaudador", "Calimaco Original", "Calimaco Normalizado", "Fecha Calimaco", 
      "Fecha Modificacion", "Estado Calimaco", "Monto Calimaco", "ID Externo", "Comentarios",
      "ID Registro Recaudador", "Fecha Recaudador", "ID Calimaco en Recaudador", "ID Proveedor",
      "Nombre Cliente", "Monto Recaudador", "Estado Proveedor", "Estado Match"
    ];

    for (let i = 0; i < conciliatedRecords.length; i += CHUNK_SIZE) {
      const chunk = conciliatedRecords.slice(i, i + CHUNK_SIZE);
      const wsDataConciliated = [conciliatedHeaders];
      
      chunk.forEach(record => {
        wsDataConciliated.push([
          record.calimaco_id?.toString() || "",
          record.collector_id?.toString() || "",
          record.calimaco_original,
          record.calimaco_normalized,
          formatDateToLocal(record.calimaco_date),
          formatDateToLocal(record.modification_date),
          record.calimaco_status,
          record.calimaco_amount,
          record.external_id,
          record.comments,
          record.collector_record_id?.toString() || "",
          formatDateToLocal(record.collector_date),
          record.collector_calimaco_id,
          record.provider_id,
          record.client_name,
          record.collector_amount,
          record.provider_status,
          record.estado
        ]);
      });

      const wsConciliated = XLSX.utils.aoa_to_sheet(wsDataConciliated);
      const sheetName = conciliatedRecords.length > CHUNK_SIZE ? `Conciliados ${Math.floor(i / CHUNK_SIZE) + 1}` : "Conciliados";
      XLSX.utils.book_append_sheet(wb, wsConciliated, sheetName);
    }
  }

  // 3. No Conciliados
  if (nonConciliatedRecords.length > 0) {
    const nonConciliatedHeaders = [
      "ID Calimaco", "ID Recaudador", "Calimaco Normalizado", "Fecha Registro", "Estado Calimaco",
      "Monto", "Estado Match", "ID Registro Recaudador", "Monto Recaudador", "Estado Recaudador"
    ];

    for (let i = 0; i < nonConciliatedRecords.length; i += CHUNK_SIZE) {
      const chunk = nonConciliatedRecords.slice(i, i + CHUNK_SIZE);
      const wsDataNonConciliated = [nonConciliatedHeaders];
      
      chunk.forEach(record => {
        wsDataNonConciliated.push([
          record.calimaco_id?.toString() || "",
          record.collector_id?.toString() || "",
          record.calimaco_normalized,
          formatDateToLocal(record.record_date),
          record.status_calimaco,
          record.amount,
          record.status_match,
          record.collector_record_id ? record.collector_record_id.toString() : "",
          record.collector_amount || "",
          record.status_collector || ""
        ]);
      });

      const wsNonConciliated = XLSX.utils.aoa_to_sheet(wsDataNonConciliated);
      const sheetName = nonConciliatedRecords.length > CHUNK_SIZE ? `No Conciliados ${Math.floor(i / CHUNK_SIZE) + 1}` : "No Conciliados";
      XLSX.utils.book_append_sheet(wb, wsNonConciliated, sheetName);
    }
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
  
  saveAs(blob, `reporte_conciliacion_completo_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`);
};
