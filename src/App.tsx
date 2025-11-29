
import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";

const STORE_NAME = "Croissant Kelbi";

type HsaTab = "rececao" | "horto" | "oleo" | "frio";

type HsaRececaoRow = {
  id: string;
  date: string;
  fornecedor: string;
  produto: string;
  validade: string;
  lote: string;
  quantidade: string;
  higieneTransporte: string;
  temperatura: string;
  decisao: string;
  rubrica: string;
  observacoes: string;
};

type HsaHortoRow = {
  id: string;
  date: string;
  produto: string;
  diluicao: string;
  tempo: string;
  observacoes: string;
  responsavel: string;
};

type HsaOleoRow = {
  id: string;
  date: string;
  equipamento: string;
  tipoOleo: string;
  leitura: string;
  temperatura: string;
  rejeitado: string;
  observacoes: string;
  rubrica: string;
};

type HsaFrioRow = {
  id: string;
  date: string;
  equipamento: string;
  leitura1: string;
  leitura2: string;
  observacoes: string;
  rubrica: string;
};

type Settings = {
  storeName: string;
};

const settings: Settings = { storeName: STORE_NAME };

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function uid(): string {
  return Math.random().toString(36).slice(2);
}

function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

function formatDatePt(dateIso: string): string {
  if (!dateIso) return "";
  const [y, m, d] = dateIso.split("-");
  return `${d}/${m}/${y}`;
}

async function loadImageAsDataURL(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function generateHsaPdfBlob(
  hsaTab: HsaTab,
  date: string,
  rececao: HsaRececaoRow[],
  horto: HsaHortoRow[],
  oleo: HsaOleoRow[],
  frio: HsaFrioRow[]
): Promise<Blob> {
  const doc = new jsPDF();
  const margin = 14;
  let y = margin;

  const logoData = await loadImageAsDataURL("/Logo Secundario Croissant Kelbi.png");
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", margin, y, 30, 18);
    } catch {
      try {
        doc.addImage(logoData, "JPEG", margin, y, 30, 18);
      } catch {
        // ignore
      }
    }
  }

  let title = "";
  if (hsaTab === "rececao") title = "HSA – Receção de Mercadorias";
  else if (hsaTab === "horto") title = "HSA – Desinfeção Hortofrutícolas";
  else if (hsaTab === "oleo") title = "HSA – Óleo de Fritura";
  else if (hsaTab === "frio") title = "HSA – Temperaturas de Frio";

  doc.setFontSize(14);
  doc.text(`${title} · ${settings.storeName}`, margin + 34, y + 8);
  doc.setFontSize(10);
  doc.text(`Data: ${formatDatePt(date)}`, margin + 34, y + 14);
  y += 26;

  const addLines = (label: string, value?: string) => {
    const v = value && value.trim().length ? value.trim() : "-";
    const line = `${label}: ${v}`;
    const lines = doc.splitTextToSize(line, 180);
    if (y + lines.length * 5 > 270) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin, y);
    y += lines.length * 5;
  };

  if (hsaTab === "rececao") {
    const rows = rececao.filter((r) => r.date === date);
    if (!rows.length) {
      addLines("Registos", "Sem registos para esta data.");
    } else {
      rows.forEach((r, idx) => {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(11);
        doc.text(`Linha ${idx + 1}`, margin, y);
        y += 6;
        doc.setFontSize(10);
        addLines("Fornecedor / Produto", `${r.fornecedor} · ${r.produto}`);
        addLines("Validade / Lote / Quantidade", `${r.validade} · ${r.lote} · ${r.quantidade}`);
        addLines("Higiene transporte / Temperatura", `${r.higieneTransporte} · ${r.temperatura} ºC`);
        addLines("Decisão / Rubrica", `${r.decisao} · ${r.rubrica}`);
        if (r.observacoes) addLines("Obs.", r.observacoes);
        y += 4;
      });
    }
  } else if (hsaTab === "horto") {
    const rows = horto.filter((r) => r.date === date);
    if (!rows.length) {
      addLines("Registos", "Sem registos para esta data.");
    } else {
      rows.forEach((r, idx) => {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(11);
        doc.text(`Linha ${idx + 1}`, margin, y);
        y += 6;
        doc.setFontSize(10);
        addLines("Produto", r.produto);
        addLines("Diluição", r.diluicao);
        addLines("Tempo (min)", r.tempo);
        if (r.observacoes) addLines("Obs.", r.observacoes);
        addLines("Responsável", r.responsavel);
        y += 4;
      });
    }
  } else if (hsaTab === "oleo") {
    const rows = oleo.filter((r) => r.date === date);
    if (!rows.length) {
      addLines("Registos", "Sem registos para esta data.");
    } else {
      rows.forEach((r, idx) => {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(11);
        doc.text(`Linha ${idx + 1}`, margin, y);
        y += 6;
        doc.setFontSize(10);
        addLines("Equipamento", r.equipamento);
        addLines("Óleo / Leitura", `${r.tipoOleo} · ${r.leitura}`);
        addLines("Temperatura (ºC)", r.temperatura);
        addLines("Rejeitado", r.rejeitado);
        if (r.observacoes) addLines("Obs.", r.observacoes);
        addLines("Rubrica", r.rubrica);
        y += 4;
      });
    }
  } else if (hsaTab === "frio") {
    const rows = frio.filter((r) => r.date === date);
    if (!rows.length) {
      addLines("Registos", "Sem registos para esta data.");
    } else {
      rows.forEach((r, idx) => {
        if (y > 260) {
          doc.addPage();
          y = margin;
        }
        doc.setFontSize(11);
        doc.text(`Equipamento ${idx + 1}`, margin, y);
        y += 6;
        doc.setFontSize(10);
        addLines("Equipamento", r.equipamento);
        addLines("1ª leitura (ºC)", r.leitura1);
        addLines("2ª leitura (ºC)", r.leitura2);
        if (r.observacoes) addLines("Obs.", r.observacoes);
        addLines("Rubrica", r.rubrica);
        y += 4;
      });
    }
  }

  const pageCount = doc.getNumberOfPages();
  const ts = new Date().toLocaleString();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(160);
    doc.line(margin, 284, 200 - margin, 284);
    doc.setFontSize(9);
    doc.text(settings.storeName, margin, 290);
    doc.text(`Gerado em ${ts} · Página ${i}/${pageCount}`, 200 - margin, 290, { align: "right" });
  }

  return doc.output("blob");
}

function buildHsaText(
  hsaTab: HsaTab,
  date: string,
  rececao: HsaRececaoRow[],
  horto: HsaHortoRow[],
  oleo: HsaOleoRow[],
  frio: HsaFrioRow[]
): string {
  const dataStr = formatDatePt(date);
  const linhas: string[] = [];

  if (hsaTab === "rececao") {
    linhas.push(`HSA · Registo de Receção de Mercadorias`);
    linhas.push(`Data: ${dataStr}`);
    linhas.push("");
    const doDia = rececao.filter((r) => r.date === date);
    if (!doDia.length) {
      linhas.push("Sem registos para esta data.");
    } else {
      doDia.forEach((r, idx) => {
        linhas.push(`--- Linha ${idx + 1} ---`);
        linhas.push(`Fornecedor / Produto: ${r.fornecedor || "-"} · ${r.produto || "-"}`);
        linhas.push(`Validade: ${r.validade || "-"} · Lote: ${r.lote || "-"} · Quantidade: ${r.quantidade || "-"}`);
        linhas.push(`Higiene transporte: ${r.higieneTransporte || "-"} · Temperatura: ${r.temperatura || "-"} ºC`);
        linhas.push(`Decisão: ${r.decisao || "-"} · Rubrica: ${r.rubrica || "-"}`);
        if (r.observacoes) linhas.push(`Obs.: ${r.observacoes}`);
        linhas.push("");
      });
    }
  } else if (hsaTab === "horto") {
    linhas.push(`HSA · Registo de Desinfeção de Hortofrutícolas`);
    linhas.push(`Data: ${dataStr}`);
    linhas.push("");
    const doDia = horto.filter((r) => r.date === date);
    if (!doDia.length) {
      linhas.push("Sem registos para esta data.");
    } else {
      doDia.forEach((r, idx) => {
        linhas.push(`--- Linha ${idx + 1} ---`);
        linhas.push(`Produto: ${r.produto || "-"}`);
        linhas.push(`Diluição: ${r.diluicao || "-"} · Tempo: ${r.tempo || "-"} min`);
        if (r.observacoes) linhas.push(`Obs.: ${r.observacoes}`);
        linhas.push(`Responsável: ${r.responsavel || "-"}`);
        linhas.push("");
      });
    }
  } else if (hsaTab === "oleo") {
    linhas.push(`HSA · Registo do Controlo do Óleo de Fritura`);
    linhas.push(`Data: ${dataStr}`);
    linhas.push("");
    const doDia = oleo.filter((r) => r.date === date);
    if (!doDia.length) {
      linhas.push("Sem registos para esta data.");
    } else {
      doDia.forEach((r, idx) => {
        linhas.push(`--- Linha ${idx + 1} ---`);
        linhas.push(`Equipamento: ${r.equipamento || "-"}`);
        linhas.push(`Óleo: ${r.tipoOleo || "-"} · Leitura: ${r.leitura || "-"}`);
        linhas.push(`Temperatura: ${r.temperatura || "-"} ºC · Rejeitado: ${r.rejeitado || "-"}`);
        if (r.observacoes) linhas.push(`Obs.: ${r.observacoes}`);
        linhas.push(`Rubrica: ${r.rubrica || "-"}`);
        linhas.push("");
      });
    }
  } else if (hsaTab === "frio") {
    linhas.push(`HSA · Registo de Temperaturas de Equipamentos de Frio`);
    linhas.push(`Data: ${dataStr}`);
    linhas.push("");
    const doDia = frio.filter((r) => r.date === date);
    if (!doDia.length) {
      linhas.push("Sem registos para esta data.");
    } else {
      doDia.forEach((r, idx) => {
        linhas.push(`--- Equipamento ${idx + 1} ---`);
        linhas.push(`Equipamento: ${r.equipamento || "-"}`);
        linhas.push(`1ª leitura: ${r.leitura1 || "-"} ºC · 2ª leitura: ${r.leitura2 || "-"} ºC`);
        if (r.observacoes) linhas.push(`Obs.: ${r.observacoes}`);
        linhas.push(`Rubrica: ${r.rubrica || "-"}`);
        linhas.push("");
      });
    }
  }

  return linhas.join("\n");
}

export default function App() {
  const [hsaTab, setHsaTab] = useState<HsaTab>("rececao");
  const [hsaDate, setHsaDate] = useState<string>(todayStr());

  const [hsaRececao, setHsaRececao] = useState<HsaRececaoRow[]>(() =>
    loadJson<HsaRececaoRow[]>("kelbi-hsa-rececao", [])
  );
  const [hsaHorto, setHsaHorto] = useState<HsaHortoRow[]>(() =>
    loadJson<HsaHortoRow[]>("kelbi-hsa-horto", [])
  );
  const [hsaOleo, setHsaOleo] = useState<HsaOleoRow[]>(() =>
    loadJson<HsaOleoRow[]>("kelbi-hsa-oleo", [])
  );
  const [hsaFrio, setHsaFrio] = useState<HsaFrioRow[]>(() =>
    loadJson<HsaFrioRow[]>("kelbi-hsa-frio", [])
  );

  useEffect(() => {
    saveJson("kelbi-hsa-rececao", hsaRececao);
  }, [hsaRececao]);
  useEffect(() => {
    saveJson("kelbi-hsa-horto", hsaHorto);
  }, [hsaHorto]);
  useEffect(() => {
    saveJson("kelbi-hsa-oleo", hsaOleo);
  }, [hsaOleo]);
  useEffect(() => {
    saveJson("kelbi-hsa-frio", hsaFrio);
  }, [hsaFrio]);

  const handleGeneratePdf = async () => {
    const blob = await generateHsaPdfBlob(hsaTab, hsaDate, hsaRececao, hsaHorto, hsaOleo, hsaFrio);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hsa-${hsaTab}-${hsaDate}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendWhatsApp = async () => {
    // Gerar o PDF e tentar partilhar via WhatsApp (Android)
    const blob = await generateHsaPdfBlob(
      hsaTab,
      hsaDate,
      hsaRececao,
      hsaHorto,
      hsaOleo,
      hsaFrio
    );

    const dateLabel = hsaDate || "sem-data";
    const fileName = `hsa-${hsaTab}-${dateLabel}.pdf`;
    const pdfFile = new File([blob], fileName, { type: "application/pdf" });

    const nav = navigator as any;

    if (nav.share && nav.canShare && nav.canShare({ files: [pdfFile] })) {
      try {
        await nav.share({
          files: [pdfFile],
          title: `HSA ${dateLabel}`,
          text: "",
        });
      } catch (err) {
        console.error("Erro ao partilhar PDF:", err);
        alert("Não foi possível enviar o PDF pelo WhatsApp.");
      }
    } else {
      alert(
        "Este dispositivo/navegador não permite enviar PDF diretamente pelo WhatsApp.\n" +
          "Faz primeiro download do PDF e anexa manualmente no WhatsApp."
      );
    }
  };

  const handleSendEmailKelbi = async (email: string) => {
    // Gerar o PDF e iniciar email para a loja certa
    const blob = await generateHsaPdfBlob(
      hsaTab,
      hsaDate,
      hsaRececao,
      hsaHorto,
      hsaOleo,
      hsaFrio
    );

    const dateLabel = hsaDate || "sem-data";
    const fileName = `hsa-${hsaTab}-${dateLabel}.pdf`;

    // Fazer download automático do PDF para ficar pronto a anexar
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    const subject = encodeURIComponent(`HSA ${dateLabel} · ${hsaTab}`);
    const body = encodeURIComponent(
      `Segue em anexo o registo HSA de ${dateLabel}.\n\nFicheiro: ${fileName}`
    );

    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

    return (
    <div className="min-h-screen bg-slate-950 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-6xl grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.7fr)] items-stretch">
        {/* Painel lateral com imagem e texto */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/25 via-amber-400/10 to-slate-900 px-6 py-8 flex flex-col justify-between shadow-2xl">
          <div
            className="absolute inset-0 pointer-events-none opacity-40 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(circle at 0 0, rgba(255,255,255,0.4), transparent 65%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.25), transparent 55%)",
            }}
          />
          <div className="relative space-y-6">
            <img
              src="/Logo Secundario Croissant Kelbi.png"
              alt="Croissant Kelbi"
              className="h-16 md:h-20 object-contain drop-shadow-xl"
            />
            <h1 className="text-3xl md:text-4xl font-semibold text-white leading-tight">
              Checklists HSA
              <span className="block text-amber-200 text-lg md:text-2xl mt-1">
                Croissant Kelbi
              </span>
            </h1>
            <p className="text-sm md:text-base text-amber-50/80 max-w-md">
              Regista receção de mercadorias, hortofrutícolas, óleo de fritura e
              temperaturas de frio num único painel simples para a equipa.
            </p>
          </div>

          <div className="relative mt-8 grid gap-3 text-xs md:text-sm text-amber-50/85">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 border border-amber-300/60 text-[0.7rem] font-semibold">
                PDF
              </span>
              <span>Exportação imediata para PDF para auditorias e arquivo.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-300/60 text-[0.7rem] font-semibold">
                Equipa
              </span>
              <span>Interface limpa e rápida para a equipa preencher no dia a dia.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-500/20 border border-sky-300/60 text-[0.7rem] font-semibold">
                HSA
              </span>
              <span>Organização profissional dos registos de Higiene e Segurança Alimentar.</span>
            </div>
          </div>
        </div>

        {/* Painel principal com formulários */}
        <div className="w-full bg-white/95 backdrop-blur-md shadow-xl rounded-3xl border border-slate-200 p-5 md:p-7 flex flex-col gap-5">
          <header className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
                Registos diários HSA
              </div>
              <div className="text-xs md:text-sm text-slate-500">
                Escolhe o tipo de registo e preenche os campos necessários.
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm text-gray-600">Data</span>
                <input
                  type="date"
                  className="border border-slate-300 rounded-lg px-3 py-2 text-xs md:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                  value={hsaDate}
                  onChange={(e) => setHsaDate(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  className="border border-slate-300 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                  onClick={handleGeneratePdf}
                >
                  Gerar PDF
                </button>
                <button
                  type="button"
                  className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition"
                  onClick={handleSendWhatsApp}
                >
                  Enviar WhatsApp
                </button>
                <button
                  type="button"
                  className="border border-slate-300 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                  onClick={() => handleSendEmailKelbi("croissantkelbicacem@gmail.com")}
                >
                  Kelbi Cacém
                </button>
                <button
                  type="button"
                  className="border border-slate-300 px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                  onClick={() => handleSendEmailKelbi("croissantkelbimemmartins@gmail.com")}
                >
                  Kelbi Mem-Martins
                </button>
              </div>
            </div>
          </header>

          <div className="tabs mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={hsaTab === "rececao" ? "tab active" : "tab"}
              onClick={() => setHsaTab("rececao")}
            >
              Receção de Mercadorias
            </button>
            <button
              type="button"
              className={hsaTab === "horto" ? "tab active" : "tab"}
              onClick={() => setHsaTab("horto")}
            >
              Desinfeção Hortofrutícolas
            </button>
            <button
              type="button"
              className={hsaTab === "oleo" ? "tab active" : "tab"}
              onClick={() => setHsaTab("oleo")}
            >
              Óleo de Fritura
            </button>
            <button
              type="button"
              className={hsaTab === "frio" ? "tab active" : "tab"}
              onClick={() => setHsaTab("frio")}
            >
              Temperaturas de Frio
            </button>
          </div>

          <div className="flex-1 min-h-[320px]">
            {hsaTab === "rececao" && (
              <HsaRececaoForm date={hsaDate} rows={hsaRececao} setRows={setHsaRececao} />
            )}
            {hsaTab === "horto" && (
              <HsaHortoForm date={hsaDate} rows={hsaHorto} setRows={setHsaHorto} />
            )}
            {hsaTab === "oleo" && (
              <HsaOleoForm date={hsaDate} rows={hsaOleo} setRows={setHsaOleo} />
            )}
            {hsaTab === "frio" && (
              <HsaFrioForm date={hsaDate} rows={hsaFrio} setRows={setHsaFrio} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
  }



type HsaRececaoFormProps = {
  date: string;
  rows: HsaRececaoRow[];
  setRows: (rows: HsaRececaoRow[]) => void;
};

function HsaRececaoForm({ date, rows, setRows }: HsaRececaoFormProps) {
  const filtered = rows.filter((r) => r.date === date);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: uid(),
        date,
        fornecedor: "",
        produto: "",
        validade: "",
        lote: "",
        quantidade: "",
        higieneTransporte: "",
        temperatura: "",
        decisao: "",
        rubrica: "",
        observacoes: "",
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<HsaRececaoRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border rounded-xl p-3">
      <div className="font-semibold mb-2">Registo de Receção de Mercadorias</div>
      <div className="text-xs text-gray-600 mb-2">
        Podes adicionar várias linhas no mesmo dia (uma por entrega).
      </div>
      <div className="grid gap-2">
        {filtered.map((r) => (
          <div key={r.id} className="border rounded-lg p-2 grid gap-2">
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Fornecedor / Tipo de produto"
                value={r.fornecedor}
                onChange={(e) => updateRow(r.id, { fornecedor: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Produto"
                value={r.produto}
                onChange={(e) => updateRow(r.id, { produto: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Validade"
                value={r.validade}
                onChange={(e) => updateRow(r.id, { validade: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Lote"
                value={r.lote}
                onChange={(e) => updateRow(r.id, { lote: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Quantidade"
                value={r.quantidade}
                onChange={(e) => updateRow(r.id, { quantidade: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Higiene do transporte"
                value={r.higieneTransporte}
                onChange={(e) =>
                  updateRow(r.id, { higieneTransporte: e.target.value })
                }
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Temperatura (ºC)"
                value={r.temperatura}
                onChange={(e) => updateRow(r.id, { temperatura: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Aceite / Rejeitado"
                value={r.decisao}
                onChange={(e) => updateRow(r.id, { decisao: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Rubrica"
                value={r.rubrica}
                onChange={(e) => updateRow(r.id, { rubrica: e.target.value })}
              />
            </div>
            <textarea
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
              placeholder="Observações"
              value={r.observacoes}
              onChange={(e) => updateRow(r.id, { observacoes: e.target.value })}
            />
            <button
              type="button"
              className="text-xs text-red-600 ml-auto"
              onClick={() => removeRow(r.id)}
            >
              Remover linha
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-800" onClick={addRow}>
        + Adicionar linha
      </button>
    </div>
  );
}

type HsaHortoFormProps = {
  date: string;
  rows: HsaHortoRow[];
  setRows: (rows: HsaHortoRow[]) => void;
};

function HsaHortoForm({ date, rows, setRows }: HsaHortoFormProps) {
  const filtered = rows.filter((r) => r.date === date);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: uid(),
        date,
        produto: "",
        diluicao: "",
        tempo: "",
        observacoes: "",
        responsavel: "",
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<HsaHortoRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border rounded-xl p-3">
      <div className="font-semibold mb-2">Registo de Desinfeção Hortofrutícolas</div>
      <div className="text-xs text-gray-600 mb-2">
        Regista aqui cada lote de hortofrutícolas desinfetado neste dia.
      </div>
      <div className="grid gap-2">
        {filtered.map((r) => (
          <div key={r.id} className="border rounded-lg p-2 grid gap-2">
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Produto"
                value={r.produto}
                onChange={(e) => updateRow(r.id, { produto: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Diluição"
                value={r.diluicao}
                onChange={(e) => updateRow(r.id, { diluicao: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Tempo (min)"
                value={r.tempo}
                onChange={(e) => updateRow(r.id, { tempo: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Responsável"
                value={r.responsavel}
                onChange={(e) => updateRow(r.id, { responsavel: e.target.value })}
              />
            </div>
            <textarea
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
              placeholder="Observações"
              value={r.observacoes}
              onChange={(e) =>
                updateRow(r.id, { observacoes: e.target.value })
              }
            />
            <button
              type="button"
              className="text-xs text-red-600 ml-auto"
              onClick={() => removeRow(r.id)}
            >
              Remover linha
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-800" onClick={addRow}>
        + Adicionar linha
      </button>
    </div>
  );
}

type HsaOleoFormProps = {
  date: string;
  rows: HsaOleoRow[];
  setRows: (rows: HsaOleoRow[]) => void;
};

function HsaOleoForm({ date, rows, setRows }: HsaOleoFormProps) {
  const filtered = rows.filter((r) => r.date === date);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: uid(),
        date,
        equipamento: "",
        tipoOleo: "",
        leitura: "",
        temperatura: "",
        rejeitado: "",
        observacoes: "",
        rubrica: "",
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<HsaOleoRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border rounded-xl p-3">
      <div className="font-semibold mb-2">Registo do Controlo do Óleo de Fritura</div>
      <div className="text-xs text-gray-600 mb-2">
        Regista aqui as leituras do teste e a decisão de rejeitar ou não o óleo.
      </div>
      <div className="grid gap-2">
        {filtered.map((r) => (
          <div key={r.id} className="border rounded-lg p-2 grid gap-2">
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Equipamento (ex.: Fritadeira 1)"
                value={r.equipamento}
                onChange={(e) =>
                  updateRow(r.id, { equipamento: e.target.value })
                }
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Óleo (Novo / Reutilizado)"
                value={r.tipoOleo}
                onChange={(e) => updateRow(r.id, { tipoOleo: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Leitura (Aceitável / Não aceitável)"
                value={r.leitura}
                onChange={(e) => updateRow(r.id, { leitura: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Temperatura (ºC)"
                value={r.temperatura}
                onChange={(e) =>
                  updateRow(r.id, { temperatura: e.target.value })
                }
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Rejeitado? (Sim / Não)"
                value={r.rejeitado}
                onChange={(e) => updateRow(r.id, { rejeitado: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
                placeholder="Rubrica"
                value={r.rubrica}
                onChange={(e) => updateRow(r.id, { rubrica: e.target.value })}
              />
            </div>
            <textarea
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-white"
              placeholder="Observações"
              value={r.observacoes}
              onChange={(e) =>
                updateRow(r.id, { observacoes: e.target.value })
              }
            />
            <button
              type="button"
              className="text-xs text-red-600 ml-auto"
              onClick={() => removeRow(r.id)}
            >
              Remover linha
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-800" onClick={addRow}>
        + Adicionar linha
      </button>
    </div>
  );
}

type HsaFrioFormProps = {
  date: string;
  rows: HsaFrioRow[];
  setRows: (rows: HsaFrioRow[]) => void;
};

function HsaFrioForm({ date, rows, setRows }: HsaFrioFormProps) {
  const filtered = rows.filter((r) => r.date === date);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: uid(),
        date,
        equipamento: "",
        leitura1: "",
        leitura2: "",
        rubrica: "",
        observacoes: "",
      },
    ]);
  };

  const updateRow = (id: string, patch: Partial<HsaFrioRow>) => {
    setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    setRows(rows.filter((r) => r.id !== id));
  };

  return (
    <div className="border rounded-xl p-3">
      <div className="font-semibold mb-2">
        Registo do Controlo das Temperaturas dos Equipamentos de Frio
      </div>
      <div className="text-xs text-gray-600 mb-2">
        Podes registar várias leituras no mesmo dia (ex.: diferentes equipamentos).
      </div>

      <div className="grid gap-2">
        {filtered.map((r) => (
          <div key={r.id} className="border rounded-lg p-2 grid gap-2">
            <div className="grid gap-2 md:grid-cols-2">
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Equipamento (ex.: Frio 1)"
                value={r.equipamento}
                onChange={(e) =>
                  updateRow(r.id, { equipamento: e.target.value })
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="1ª leitura (ºC)"
                value={r.leitura1}
                onChange={(e) =>
                  updateRow(r.id, { leitura1: e.target.value })
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="2ª leitura (ºC)"
                value={r.leitura2}
                onChange={(e) =>
                  updateRow(r.id, { leitura2: e.target.value })
                }
              />
              <input
                className="border rounded px-2 py-1 text-sm"
                placeholder="Rubrica"
                value={r.rubrica}
                onChange={(e) =>
                  updateRow(r.id, { rubrica: e.target.value })
                }
              />
            </div>

            <textarea
              className="border rounded px-2 py-1 text-sm"
              placeholder="Observações"
              value={r.observacoes}
              onChange={(e) =>
                updateRow(r.id, { observacoes: e.target.value })
              }
            />

            <button
              type="button"
              className="text-xs text-red-600 ml-auto"
              onClick={() => removeRow(r.id)}
            >
              Remover linha
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-3 text-sm font-medium text-amber-700 hover:text-amber-800"
        onClick={addRow}
      >
        + Adicionar linha
      </button>
    </div>
  );
}
