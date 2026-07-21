import {
  formatPaymentHistorySummary,
  getAllPaymentHistory,
  getExpensePaymentHistory,
  PaymentHistoryEntry,
} from "./historyPayment";
import {
  formatChangeRequestHistorySummary,
  getChangeRequestLogs,
} from "./changeRequestHistory";
import { getPaidAmount, getRemainingAmount } from "./payment";
import { Expense } from "./types";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "";
  return Number(value).toFixed(2);
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatDateTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusLabel(status: string): string {
  switch (status) {
    case "PENDING_APPROVER":
      return "Pending Approver";
    case "CHANGES_REQUESTED":
      return "Changes Requested";
    case "APPROVED_APPROVER":
      return "Pending Processing";
    case "PARTIALLY_PAID":
      return "Partially Paid";
    case "PROCESSED":
      return "Processed & Paid";
    case "REJECTED_APPROVER":
      return "Rejected by Approver";
    case "REJECTED_PROCESSOR":
      return "Rejected by Processor";
    default:
      return status;
  }
}

type ColDef<T> = {
  header: string;
  width: number;
  align?: "Left" | "Right" | "Center";
  wrap?: boolean;
  /** Export as Excel Number (avoids "number stored as text"). */
  number?: boolean;
  get: (row: T) => string;
};

const EXPENSE_COLUMNS: ColDef<Expense>[] = [
  { header: "Request ID", width: 180, get: (e) => e.id },
  { header: "Requester Name", width: 130, get: (e) => e.requesterName },
  { header: "Requester Email", width: 170, get: (e) => e.requesterEmail },
  { header: "Country", width: 110, get: (e) => e.country || "" },
  { header: "Currency", width: 75, align: "Center", get: (e) => (e.currency || "").toUpperCase() },
  {
    header: "Local Amount",
    width: 100,
    align: "Right",
    number: true,
    get: (e) => formatMoney(e.originalAmount),
  },
  {
    header: "Amount (USD)",
    width: 100,
    align: "Right",
    number: true,
    get: (e) => formatMoney(e.amount),
  },
  {
    header: "Total Paid (USD)",
    width: 110,
    align: "Right",
    number: true,
    get: (e) => formatMoney(getPaidAmount(e)),
  },
  {
    header: "Remaining (USD)",
    width: 110,
    align: "Right",
    number: true,
    get: (e) => formatMoney(getRemainingAmount(e)),
  },
  {
    header: "Payment Count",
    width: 95,
    align: "Center",
    number: true,
    get: (e) => String(getExpensePaymentHistory(e).length),
  },
  {
    header: "Date Fully Paid",
    width: 150,
    get: (e) => {
      if (e.status !== "PROCESSED") return "";
      const payments = getExpensePaymentHistory(e);
      const lastFull = [...payments].reverse().find((p) => p.paymentType === "Full");
      return lastFull ? formatDateTime(lastFull.timestamp) : formatDateTime(e.processedAt);
    },
  },
  {
    header: "Payment History",
    width: 420,
    wrap: true,
    get: (e) => formatPaymentHistorySummary(getExpensePaymentHistory(e)),
  },
  { header: "Category", width: 100, get: (e) => e.category },
  { header: "Project", width: 100, get: (e) => e.project || "" },
  { header: "Description", width: 220, get: (e) => e.description || "" },
  { header: "Expense Date", width: 105, get: (e) => formatDate(e.date) },
  { header: "Invoice Number", width: 120, get: (e) => e.invoiceNumber || "" },
  { header: "Invoice Date", width: 105, get: (e) => formatDate(e.invoiceDate) },
  { header: "Due Date", width: 105, get: (e) => formatDate(e.dueDate) },
  { header: "Status", width: 130, get: (e) => statusLabel(e.status) },
  { header: "Date Submitted", width: 150, get: (e) => formatDateTime(e.submittedAt) },
  { header: "Manager Notes", width: 180, get: (e) => e.approverNotes || "" },
  { header: "Finance Notes", width: 180, get: (e) => e.processorNotes || "" },
  {
    header: "Change Requests Count",
    width: 110,
    align: "Center",
    number: true,
    get: (e) => String(getChangeRequestLogs(e).length),
  },
  {
    header: "All Change Request History",
    width: 420,
    wrap: true,
    get: (e) => formatChangeRequestHistorySummary(e),
  },
  {
    header: "Latest Change Request Notes",
    width: 220,
    wrap: true,
    get: (e) => e.changeRequestNotes || "",
  },
  { header: "Latest Change Requested By", width: 180, get: (e) => e.changeRequestedBy || "" },
  {
    header: "Latest Change Requested At",
    width: 150,
    get: (e) => formatDateTime(e.changeRequestedAt),
  },
];

type WorkflowHistoryEntry = {
  requestId: string;
  requesterName: string;
  action: string;
  timestamp: string;
  loggedBy: string;
  notes: string;
};

type ChangeRequestExportEntry = {
  requestId: string;
  requesterName: string;
  sequence: number;
  action: string;
  timestamp: string;
  loggedBy: string;
  notes: string;
};

function getAllWorkflowHistory(expenses: Expense[]): WorkflowHistoryEntry[] {
  const rows: WorkflowHistoryEntry[] = [];
  for (const expense of expenses) {
    for (const log of expense.history || []) {
      rows.push({
        requestId: expense.id,
        requesterName: expense.requesterName,
        action: log.action,
        timestamp: log.timestamp,
        loggedBy: log.user,
        notes: log.notes || "",
      });
    }
  }
  return rows.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function getAllChangeRequestHistory(expenses: Expense[]): ChangeRequestExportEntry[] {
  const rows: ChangeRequestExportEntry[] = [];
  for (const expense of expenses) {
    const logs = getChangeRequestLogs(expense);
    logs.forEach((log, index) => {
      rows.push({
        requestId: expense.id,
        requesterName: expense.requesterName,
        sequence: index + 1,
        action: log.action,
        timestamp: log.timestamp,
        loggedBy: log.user,
        notes: log.notes,
      });
    });
  }
  return rows.sort((a, b) => {
    const byId = a.requestId.localeCompare(b.requestId);
    if (byId !== 0) return byId;
    return a.sequence - b.sequence;
  });
}

const WORKFLOW_COLUMNS: ColDef<WorkflowHistoryEntry>[] = [
  { header: "Request ID", width: 180, get: (r) => r.requestId },
  { header: "Requester Name", width: 130, get: (r) => r.requesterName },
  { header: "Action", width: 180, get: (r) => r.action },
  { header: "Timestamp", width: 150, get: (r) => formatDateTime(r.timestamp) },
  { header: "Logged By", width: 200, get: (r) => r.loggedBy },
  { header: "Notes / Command", width: 280, wrap: true, get: (r) => r.notes },
];

const CHANGE_REQUEST_COLUMNS: ColDef<ChangeRequestExportEntry>[] = [
  { header: "Request ID", width: 180, get: (r) => r.requestId },
  { header: "Requester Name", width: 130, get: (r) => r.requesterName },
  { header: "#", width: 50, align: "Center", number: true, get: (r) => String(r.sequence) },
  { header: "Action", width: 160, get: (r) => r.action },
  { header: "Timestamp", width: 150, get: (r) => formatDateTime(r.timestamp) },
  { header: "Requested By", width: 200, get: (r) => r.loggedBy },
  { header: "Command / Notes", width: 300, wrap: true, get: (r) => r.notes },
];

const PAYMENT_COLUMNS: ColDef<PaymentHistoryEntry>[] = [
  { header: "Request ID", width: 180, get: (p) => p.requestId },
  { header: "Requester Name", width: 130, get: (p) => p.requesterName },
  {
    header: "Payment #",
    width: 75,
    align: "Center",
    number: true,
    get: (p) => String(p.paymentNumber),
  },
  { header: "Payment Date", width: 150, get: (p) => formatDateTime(p.timestamp) },
  {
    header: "Type",
    width: 90,
    align: "Center",
    get: (p) => (p.paymentType === "Full" ? "Full payment" : "Partial payment"),
  },
  {
    header: "This Payment (USD)",
    width: 120,
    align: "Right",
    number: true,
    get: (p) => formatMoney(p.paymentAmount),
  },
  {
    header: "Total Paid After (USD)",
    width: 130,
    align: "Right",
    number: true,
    get: (p) => formatMoney(p.totalPaidAfter),
  },
  {
    header: "Remaining After (USD)",
    width: 130,
    align: "Right",
    number: true,
    get: (p) => formatMoney(p.remainingAfter),
  },
  { header: "Notes", width: 220, wrap: true, get: (p) => p.notes },
  { header: "Logged By", width: 200, get: (p) => p.loggedBy },
];

function styleForCell(align: "Left" | "Right" | "Center", zebra: boolean): string {
  if (align === "Right") return zebra ? "CellRightAlt" : "CellRight";
  if (align === "Center") return zebra ? "CellCenterAlt" : "CellCenter";
  return zebra ? "CellLeftAlt" : "CellLeft";
}

function estimateWrappedRowHeight(values: string[], defaultRowHeight: number): number {
  const totalLines = values.reduce((sum, value) => {
    if (!value) return sum;
    // Count blank separators between blocks as visual lines too
    return sum + value.split("\n").length;
  }, 0);
  if (totalLines <= 1) return defaultRowHeight;
  return Math.min(320, Math.max(56, 16 * totalLines + 8));
}

function buildWorksheet<T>(
  name: string,
  columns: ColDef<T>[],
  rows: T[],
  defaultRowHeight = 24
): string {
  const columnXml = columns
    .map((col) => `<Column ss:AutoFitWidth="0" ss:Width="${col.width}"/>`)
    .join("");

  const headerCells = columns
    .map(
      (col) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`
    )
    .join("");

  const dataRows = rows
    .map((row, rowIndex) => {
      const zebra = rowIndex % 2 === 1;
      const wrappedValues = columns
        .filter((col) => col.wrap)
        .map((col) => col.get(row))
        .filter(Boolean);
      const rowHeight = estimateWrappedRowHeight(wrappedValues, defaultRowHeight);
      const cells = columns
        .map((col) => {
          const styleId = col.wrap
            ? zebra
              ? "CellWrapAlt"
              : "CellWrap"
            : styleForCell(col.align || "Left", zebra);
          const value = col.get(row);
          if (col.number && value !== "" && Number.isFinite(Number(value))) {
            return `<Cell ss:StyleID="${styleId}"><Data ss:Type="Number">${value}</Data></Cell>`;
          }
          const text = escapeXml(value);
          const cellText = col.wrap ? text.replace(/\n/g, "&#10;") : text;
          const dataAttrs = col.wrap
            ? `ss:Type="String" xml:space="preserve"`
            : `ss:Type="String"`;
          return `<Cell ss:StyleID="${styleId}"><Data ${dataAttrs}>${cellText}</Data></Cell>`;
        })
        .join("");
      return `<Row ss:Height="${rowHeight}">${cells}</Row>`;
    })
    .join("");

  return `<Worksheet ss:Name="${escapeXml(name)}">
  <Table ss:ExpandedColumnCount="${columns.length}" ss:ExpandedRowCount="${
    rows.length + 1
  }" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="22">
   ${columnXml}
   <Row ss:Height="28">${headerCells}</Row>
   ${dataRows}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <Selected/>
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
   <Panes>
    <Pane>
     <Number>3</Number>
    </Pane>
    <Pane>
     <Number>2</Number>
     <ActiveRow>0</ActiveRow>
    </Pane>
   </Panes>
   <ProtectObjects>False</ProtectObjects>
   <ProtectScenarios>False</ProtectScenarios>
  </WorksheetOptions>
 </Worksheet>`;
}

const SHARED_STYLES = `
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1850A8"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1850A8"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1850A8"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#1850A8"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#203C62" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellLeftAlt">
   <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellRight">
   <Alignment ss:Horizontal="Right" ss:Vertical="Top"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="CellRightAlt">
   <Alignment ss:Horizontal="Right" ss:Vertical="Top"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
   <NumberFormat ss:Format="#,##0.00"/>
  </Style>
  <Style ss:ID="CellCenter">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellCenterAlt">
   <Alignment ss:Horizontal="Center" ss:Vertical="Top"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellWrap">
   <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellWrapAlt">
   <Alignment ss:Horizontal="Left" ss:Vertical="Top" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#CBD5E1"/>
   </Borders>
   <Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>`;

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Excel SpreadsheetML export — expense summary + change requests + workflow + payments.
 */
export function exportExpensesReport(rows: Expense[]) {
  const stamp = new Date().toISOString().split("T")[0];
  const paymentRows = getAllPaymentHistory(rows);
  const workflowRows = getAllWorkflowHistory(rows);
  const changeRequestRows = getAllChangeRequestHistory(rows);

  const expenseSheet = buildWorksheet("Expense Report", EXPENSE_COLUMNS, rows);
  const changeSheet = buildWorksheet("Change Requests", CHANGE_REQUEST_COLUMNS, changeRequestRows);
  const workflowSheet = buildWorksheet("Workflow History", WORKFLOW_COLUMNS, workflowRows);
  const paymentSheet = buildWorksheet("Payment History", PAYMENT_COLUMNS, paymentRows);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Title>Aceolution Finance Expense Report</Title>
  <Author>Aceolution Finance</Author>
 </DocumentProperties>
 <Styles>${SHARED_STYLES}
 </Styles>
 ${expenseSheet}
 ${changeSheet}
 ${workflowSheet}
 ${paymentSheet}
</Workbook>`;

  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  downloadBlob(blob, `AceolutionFinance_Report_${stamp}.xls`);
}
