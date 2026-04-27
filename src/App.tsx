import { useState, useMemo, useEffect } from 'react';
import {
  Gavel,
  Search,
  Save,
  X,
  Briefcase,
  Calculator,
  Check,
  User,
  Home,
  Menu,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Plus,
  LayoutGrid,
  Pencil,
  Eye,
  Copy,
  Trash2
} from 'lucide-react';
import './App.css';

// Types and Interfaces
interface Bond {
  id: string;
  role: string;
  department: string;
  type: string;
  gross: number;
  prev: number;
  pensao: number;
  irrf: number;
  outrasPenhoras: number;
}

interface Penhora {
  id: string;
  servidor: string;
  cpf: string;
  matricula: string;
  processo: string;
  valor: string;
  tipo: 'Porcentagem' | 'Fixo';
  base: string;
  dataInicio: string;
  dataTermino: string;
  status: string;
  vara: string;
  totalDebt: number;
}

// Mock data for the user bonds
const mockBonds: Bond[] = [
  { id: '1', role: 'Analista de Sistemas', department: 'SEFAZ', type: 'Efetivo', gross: 10899.45, prev: 1144.44, pensao: 0, irrf: 1773.91, outrasPenhoras: 1200 },
  { id: '2', role: 'Professor Substituto', department: 'SEDUC', type: 'Contratado', gross: 4200, prev: 588, pensao: 0, irrf: 250, outrasPenhoras: 0 }
];

// Helper functions for currency masking
const formatCurrencyInput = (value: string | number) => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  const cleanValue = value.replace(/\D/g, '');
  const numberValue = Number(cleanValue) / 100;
  return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrencyInput = (value: string) => {
  const cleanValue = value.replace(/\D/g, '');
  return Number(cleanValue) / 100;
};

const INITIAL_MOCK_PENHORAS: Penhora[] = [
  { id: '1', servidor: 'ROBERTO JUNIOR', cpf: '123.456.789-00', matricula: '10001', processo: '0012345-67.2023.8.11.0001', valor: '30%', tipo: 'Porcentagem', base: 'Líquido', dataInicio: '01/01/2024', dataTermino: '01/01/2026', status: 'Ativo', vara: '2ª Vara Cível de Cuiabá', totalDebt: 15000 },
  { id: '2', servidor: 'MARIA OLIVEIRA', cpf: '987.654.321-11', matricula: '10002', processo: '0098765-43.2022.8.11.0041', valor: 'R$ 1.550,00', tipo: 'Fixo', base: '-', dataInicio: '15/05/2023', dataTermino: '15/05/2025', status: 'Ativo', vara: '1ª Vara Família', totalDebt: 0 },
  { id: '3', servidor: 'CARLOS SANTOS', cpf: '456.789.123-22', matricula: '10003', processo: '0045678-90.2021.8.11.0002', valor: '20%', tipo: 'Porcentagem', base: 'Bruto', dataInicio: '10/10/2021', dataTermino: '10/10/2023', status: 'Encerrado', vara: '3ª Vara Cível', totalDebt: 5000 },
  { id: '4', servidor: 'ANA PAULA SILVA', cpf: '789.012.345-33', matricula: '10004', processo: '0078901-23.2024.8.11.0005', valor: '15%', tipo: 'Porcentagem', base: 'Líquido', dataInicio: '01/03/2024', dataTermino: '-', status: 'Inativo', vara: '5ª Vara Cível', totalDebt: 0 },
  { id: '5', servidor: 'ROBERTO JUNIOR', cpf: '123.456.789-00', matricula: '10001', processo: '0055555-44.2024.8.11.0001', valor: '10%', tipo: 'Porcentagem', base: 'Bruto', dataInicio: '10/04/2024', dataTermino: '10/04/2025', status: 'Ativo', vara: '4ª Vara Cível', totalDebt: 2500 },
];

const formatDateBR = (dateString: string) => {
  if (!dateString) return '-';
  if (dateString.includes('/')) return dateString; // Already in BR format
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
};

function App() {
  const [selectedBonds, setSelectedBonds] = useState<string[]>(['1']);
  const [calculationType, setCalculationType] = useState('percentage');
  const [cpfServidor, setCpfServidor] = useState<string>('');
  const [percentage, setPercentage] = useState<number>(30);
  const [fixedValue, setFixedValue] = useState<number>(0);
  const [incide13, setIncide13] = useState<boolean>(true);
  const [incideFerias, setIncideFerias] = useState<boolean>(true);
  const [deductPrev, setDeductPrev] = useState<boolean>(true);
  const [deductIRRF, setDeductIRRF] = useState<boolean>(true);
  const [deductOutras, setDeductOutras] = useState<boolean>(true);
  const [deductPensao, setDeductPensao] = useState<boolean>(true);
  const [activeScreen, setActiveScreen] = useState<'form' | 'list'>('list');
  const [editingPenhora, setEditingPenhora] = useState<Penhora | null>(null);
  const [viewingPenhora, setViewingPenhora] = useState<Penhora | null>(null);
  const [expandedServers, setExpandedServers] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [salaryMethod, setSalaryMethod] = useState<'auto' | 'manual'>('auto');
  const [manualGross, setManualGross] = useState<number>(0);
  const [manualPrev, setManualPrev] = useState<number>(0);
  const [manualPensao, setManualPensao] = useState<number>(0);
  const [manualIRRF, setManualIRRF] = useState<number>(0);
  const [totalDebt, setTotalDebt] = useState<number>(0);
  const [nomeServidor, setNomeServidor] = useState<string>('');
  const [numeroProcesso, setNumeroProcesso] = useState<string>('');
  const [varaJudicial, setVaraJudicial] = useState<string>('');
  const [dataInicioForm, setDataInicioForm] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [dataTerminoForm, setDataTerminoForm] = useState<string>('');
  const [status, setStatus] = useState<string>('Ativo');
  const [earlyPayoffValue, setEarlyPayoffValue] = useState<number>(0);
  const [showPayoffModal, setShowPayoffModal] = useState<boolean>(false);
  const [payoffObservations, setPayoffObservations] = useState<string>('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const [listPenhoras, setListPenhoras] = useState<Penhora[]>(INITIAL_MOCK_PENHORAS);

  const groupedPenhoras = useMemo(() => {
    const groups: { [key: string]: Penhora[] } = {};
    const filtered = listPenhoras.filter(p =>
      p.servidor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cpf.includes(searchQuery) ||
      p.matricula.includes(searchQuery)
    );
    filtered.forEach(p => {
      if (!groups[p.servidor]) groups[p.servidor] = [];
      groups[p.servidor].push(p);
    });
    return groups;
  }, [listPenhoras, searchQuery]);

  const toggleServerExpand = (servidor: string) => {
    setExpandedServers(prev =>
      prev.includes(servidor) ? prev.filter(s => s !== servidor) : [...prev, servidor]
    );
  };

  const handleSave = () => {
    if (!cpfServidor || !numeroProcesso || totalDebt <= 0) {
      alert('⚠️ Atenção: Para lançar a penhora, é obrigatório preencher o CPF, o Número do Processo e o Valor Total da Dívida.');
      return;
    }
    
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      const newEntry: Penhora = {
        id: editingPenhora ? editingPenhora.id : (listPenhoras.length + 1).toString(),
        servidor: nomeServidor || (editingPenhora ? editingPenhora.servidor : 'Novo Servidor'),
        cpf: cpfServidor,
        matricula: editingPenhora ? editingPenhora.matricula : '1000' + (listPenhoras.length + 1),
        processo: numeroProcesso,
        vara: varaJudicial,
        valor: calculationType === 'percentage' ? `${percentage}%` : `R$ ${fixedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        tipo: calculationType === 'percentage' ? 'Porcentagem' : 'Fixo',
        base: calculationType === 'percentage' ? 'Líquido' : '-',
        dataInicio: dataInicioForm,
        dataTermino: dataTerminoForm,
        status: status,
        totalDebt: totalDebt
      };

      if (editingPenhora) {
        setListPenhoras(prev => prev.map(p => p.id === editingPenhora.id ? newEntry : p));
      } else {
        setListPenhoras(prev => [newEntry, ...prev]);
      }

      setIsSaving(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setActiveScreen('list');
        resetCalc();
      }, 2000);
    }, 1500);
  };

  const resetCalc = () => {
    setSalaryMethod('auto');
    setManualGross(0);
    setManualPrev(0);
    setManualPensao(0);
    setManualIRRF(0);
    setSelectedBonds([]);
    setIncide13(true);
    setIncideFerias(true);
    setDeductPrev(true);
    setDeductIRRF(true);
    setDeductOutras(true);
    setDeductPensao(true);
    setCalculationType('percentage');
    setPercentage(30);
    setFixedValue(0);
    setTotalDebt(0);
    setNomeServidor('');
    setNumeroProcesso('');
    setVaraJudicial('');
    setDataTerminoForm('');
    setStatus('Ativo');
    setEarlyPayoffValue(0);
    setPayoffObservations('');
    setEditingPenhora(null);
  };

  const handleEdit = (penhora: Penhora) => {
    resetCalc(); // Clear everything first
    setCpfServidor(penhora.cpf);
    setNomeServidor(penhora.servidor);
    setNumeroProcesso(penhora.processo);
    setVaraJudicial(penhora.vara);

    // Date conversion from DD/MM/YYYY to YYYY-MM-DD
    if (penhora.dataInicio && penhora.dataInicio.includes('/')) {
      const [d, m, y] = penhora.dataInicio.split('/');
      setDataInicioForm(`${y}-${m}-${d}`);
    }

    if (penhora.dataTermino && penhora.dataTermino.includes('/')) {
      const [d, m, y] = penhora.dataTermino.split('/');
      setDataTerminoForm(`${y}-${m}-${d}`);
    }

    const isPercentage = penhora.tipo === 'Porcentagem';
    setCalculationType(isPercentage ? 'percentage' : 'fixed');

    if (isPercentage) {
      setPercentage(parseFloat(penhora.valor.replace('%', '')) || 0);
    } else {
      const cleanValue = penhora.valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
      setFixedValue(parseFloat(cleanValue) || 0);
    }

    setTotalDebt(penhora.totalDebt || 0);
    setStatus(penhora.status || 'Ativo');
    setSelectedBonds(['1']); // Pre-select a bond to show calculation result

    setActiveScreen('form');
    setEditingPenhora(penhora);
    setViewingPenhora(null); // Close modal if open
  };

  const toggleBond = (id: string) => {
    setSelectedBonds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  // Calculate totals based on selected bonds
  const totals = useMemo(() => {
    if (salaryMethod === 'manual') {
      const gross = manualGross;
      const prev = manualPrev;
      const pensao = manualPensao;
      const irrf = manualIRRF;

      let finalGross = gross;
      if (incide13) finalGross += gross;
      if (incideFerias) finalGross += (gross * 1.3333);

      const net = finalGross - (deductPrev ? prev : 0) - (deductPensao ? pensao : 0) - (deductIRRF ? irrf : 0);
      return { gross: finalGross, prev, pensao, irrf, outrasPenhoras: 0, net };
    }

    const selected = mockBonds.filter(b => selectedBonds.includes(b.id));
    const gross = selected.reduce((sum, b) => sum + b.gross, 0);
    const prev = selected.reduce((sum, b) => sum + b.prev, 0);
    const pensao = selected.reduce((sum, b) => sum + b.pensao, 0);
    const irrf = selected.reduce((sum, b) => sum + b.irrf, 0);
    const outrasPenhoras = selected.reduce((sum, b) => sum + (b.outrasPenhoras || 0), 0);

    // Applying dynamic deductions
    let finalGross = gross;
    if (incide13) finalGross += gross;
    if (incideFerias) finalGross += (gross * 1.3333);

    const net = finalGross
      - (deductPrev ? prev : 0)
      - (deductPensao ? pensao : 0)
      - (deductIRRF ? irrf : 0)
      - (deductOutras ? outrasPenhoras : 0);

    return { gross: finalGross, prev, pensao, irrf, outrasPenhoras, net, baseDebt: totalDebt };
  }, [selectedBonds, deductPrev, deductPensao, deductIRRF, deductOutras, salaryMethod, manualGross, manualPrev, manualPensao, manualIRRF, incide13, incideFerias, totalDebt]);

  // Calculate final discount
  const finalDiscount = useMemo(() => {
    if (calculationType === 'percentage') {
      return (totals.net * (percentage / 100));
    }
    return fixedValue;
  }, [calculationType, percentage, fixedValue, totals]);

  // Auto-generate dates based on debt and installments
  useEffect(() => {
    if (totalDebt > 0 && finalDiscount > 0 && dataInicioForm) {
      // Use existing date but handle YYYY-MM-DD format
      let start: Date;
      const dateParts = dataInicioForm.split('-');
      if (dateParts.length === 3) {
        const [y, m, d] = dateParts.map(Number);
        start = new Date(y, m - 1, d);
      } else {
        start = new Date();
      }

      const installments = Math.ceil(totalDebt / finalDiscount);
      const end = new Date(start);
      end.setMonth(start.getMonth() + installments);

      const eYear = end.getFullYear();
      const eMonth = String(end.getMonth() + 1).padStart(2, '0');
      const eDay = String(end.getDate()).padStart(2, '0');
      setDataTerminoForm(`${eYear}-${eMonth}-${eDay}`);
    }
  }, [totalDebt, finalDiscount, dataInicioForm]);



  return (
    <div className="app-wrapper">
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#10B981',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <Check size={20} />
          <div>
            <div style={{ fontWeight: 'bold' }}>Sucesso!</div>
            <div style={{ fontSize: '0.8rem' }}>Penhora (Rubrica 8014) criada e vinculada ao dossiê do servidor.</div>
          </div>
        </div>
      )}

      {/* Sidebar Navigation - SIGEP Layout */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo-container">
          <div className="logo-text">
            <span>SEPLAG</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 300 }}>Mato Grosso</span>
          </div>
        </div>

        <div className="user-profile">
          <div className="user-avatar">
            <User size={24} color="white" />
          </div>
          <div className="user-name">
            CARLOS VITOR
          </div>
          <div className="user-bond">Vínculo 1</div>
        </div>

        <nav className="nav-menu">
          <a className="nav-item">
            <div className="nav-item-left">
              <Home size={18} />
              <span>Página Inicial</span>
            </div>
          </a>
          <a className="nav-item active">
            <div className="nav-item-left">
              <Menu size={18} />
              <span>Cadastro</span>
            </div>
            <ChevronDown size={16} />
          </a>
          {/* Sub menu simulation for Penhoras under Cadastro */}
          <div style={{ background: 'rgba(0,0,0,0.1)', padding: '0.5rem 0' }}>
            <a
              id="nav-form"
              href="#"
              className={`nav-item ${activeScreen === 'form' ? 'active' : ''}`}
              style={{ paddingLeft: '2.5rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
              onClick={(e) => { e.preventDefault(); setActiveScreen('form'); }}
            >
              Registrar Penhora
            </a>
            <a
              id="nav-list"
              href="#"
              className={`nav-item ${activeScreen === 'list' ? 'active' : ''}`}
              style={{ paddingLeft: '2.5rem', fontSize: '0.8rem', border: 'none', cursor: 'pointer' }}
              onClick={(e) => { e.preventDefault(); setActiveScreen('list'); }}
            >
              <div className="nav-item-left" style={{ color: activeScreen === 'list' ? '#60A5FA' : 'inherit' }}>
                <Gavel size={14} />
                <span>Gestão de Penhoras</span>
              </div>
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Area */}
      <main className="main-area">
        {/* Topbar matching layout */}
        <div className="topbar">
          <div className="topbar-left">
            <Menu className="mobile-menu-btn" size={20} onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            <X size={20} style={{ cursor: 'pointer' }} className="hide-on-mobile" />
          </div>
          <div className="topbar-right">
            <span>gestão - Teste</span>
            <LayoutGrid size={16} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Watermark Logo (faint background) */}
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Bras%C3%A3o_de_Mato_Grosso.svg/800px-Bras%C3%A3o_de_Mato_Grosso.svg.png"
          className="watermark"
          alt="Brasão de Mato Grosso"
        />

        {/* Scrollable Content inside main area */}
        <div className="content-wrapper">
          {activeScreen === 'form' ? (
            <>
              <header className="page-header">
                <h1 className="page-title">Registrar Penhora Judicial</h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Sistema automatizado para lançamento de penhoras judiciais em folha
                </p>
              </header>

              <div className="grid-layout">
                {/* Left Column: Form Details */}
                <div className="form-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                  <div className="card">
                    <h2 className="card-title">
                      <Gavel size={18} />
                      Dados do Processo
                    </h2>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">CPF (Servidor / Devedor)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Somente números..."
                          maxLength={14}
                          value={cpfServidor}
                          onChange={(e) => setCpfServidor(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Nome Completo</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Nome do exequente ou beneficiário"
                          value={nomeServidor}
                          onChange={(e) => setNomeServidor(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Número do Processo</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="0000000-00.0000.0.00.0000"
                        value={numeroProcesso}
                        onChange={(e) => setNumeroProcesso(e.target.value)}
                      />
                    </div>

                    <div className="form-row" style={{ gridTemplateColumns: '1.5fr 1fr 1fr' }}>
                      <div className="form-group">
                        <label className="form-label">Vara Judicial</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: 2ª Vara Cível de Cuiabá"
                          value={varaJudicial}
                          onChange={(e) => setVaraJudicial(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Data de Início</label>
                        <input
                          type="date"
                          className="form-input"
                          value={dataInicioForm}
                          onChange={(e) => setDataInicioForm(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Data de Término</label>
                        <input
                          type="date"
                          className="form-input"
                          value={dataTerminoForm}
                          onChange={(e) => setDataTerminoForm(e.target.value)}
                        />
                      </div>
                    </div>

                    {editingPenhora && (
                      <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="form-group">
                          <label className="form-label">Situação do Registro</label>
                          <select 
                            className="form-input" 
                            value={status}
                            onChange={(e) => {
                              const newStatus = e.target.value;
                              setStatus(newStatus);
                              if (newStatus === 'Inativo') {
                                setShowPayoffModal(true);
                              }
                            }}
                            style={{ background: 'white' }}
                          >
                            <option value="Ativo">🟢 Ativo (Em andamento)</option>
                            <option value="Encerrado">⚪ Encerrado (Prazo concluído)</option>
                            <option value="Inativo">🔴 Inativo (Quitação Antecipada / Adiantado)</option>
                          </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label">Observações Internas (Somente sistema)</label>
                          <textarea 
                            className="form-textarea" 
                            rows={1} 
                            placeholder="Detalhes adicionais..." 
                            style={{ height: '38px' }}
                            value={payoffObservations}
                            onChange={(e) => setPayoffObservations(e.target.value)}
                          ></textarea>
                        </div>
                      </div>
                    )}

                    {editingPenhora && status === 'Inativo' && earlyPayoffValue > 0 && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 600 }}>QUITAÇÃO REGISTRADA</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#991B1B' }}>R$ {formatCurrencyInput(earlyPayoffValue)}</div>
                        </div>
                        <button 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.75rem', padding: '4px 10px', height: '28px', color: '#991B1B', borderColor: '#FECACA' }}
                          onClick={() => setShowPayoffModal(true)}
                        >
                          Alterar Valor
                        </button>
                      </div>
                    )}

                    {!editingPenhora && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Observações Internas (Somente sistema)</label>
                        <textarea className="form-textarea" rows={2} placeholder="Detalhes adicionais da ordem judicial..." style={{ minHeight: '80px' }}></textarea>
                      </div>
                    )}
                  </div>

                  <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h2 className="card-title" style={{ marginBottom: 0 }}>
                        <Briefcase size={18} />
                        Seleção de Vínculos
                      </h2>
                    </div>

                    <>
                      {cpfServidor.replace(/\D/g, '').length >= 11 ? (
                        <div className="bonds-list">
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            Marque os vínculos onde a penhora deverá incidir. O sistema fará a somatória automaticamente.
                          </p>
                          {mockBonds.map(bond => {
                            const isSelected = selectedBonds.includes(bond.id);
                            const netBaseLegal = bond.gross - bond.prev - bond.pensao - bond.irrf;
                            const net = netBaseLegal - (bond.outrasPenhoras || 0);
                            return (
                              <div
                                key={bond.id}
                                className={`bond-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleBond(bond.id)}
                              >
                                <div className="checkbox-custom">
                                  {isSelected && <Check size={12} color="white" />}
                                </div>
                                <div className="bond-info">
                                  <div className="bond-title">{bond.role}</div>
                                  <div className="bond-subtitle">{bond.department} • {bond.type}</div>
                                </div>
                                <div className="bond-salary">
                                  <div className="bond-gross">R$ {bond.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                  <div className="bond-net">Líquido: R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: '#F8FAFC', borderRadius: '6px', border: '1px dashed #CBD5E1' }}>
                          <Search size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
                          <p style={{ fontSize: '0.85rem' }}>Aguardando preenchimento do CPF...</p>
                          <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Os vínculos ativos serão listados aqui.</p>
                        </div>
                      )}
                    </>
                  </div>

                </div>

                {/* Right Column: Calculation Engine */}
                <div>
                  <div className="card" style={{ position: 'sticky', top: '0', zIndex: 2 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 className="card-title" style={{ marginBottom: 0 }}>
                        <Calculator size={18} />
                        Base de Cálculo
                      </h2>
                      <button
                        onClick={resetCalc}
                        style={{ background: 'none', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                      >
                        <RotateCcw size={12} />
                        Limpar
                      </button>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tipo de Cálculo</label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                        <button
                          className={`btn ${calculationType === 'percentage' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1 }}
                          onClick={() => setCalculationType('percentage')}
                        >
                          Porcentagem (%)
                        </button>
                        <button
                          className={`btn ${calculationType === 'fixed' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ flex: 1 }}
                          onClick={() => setCalculationType('fixed')}
                        >
                          Valor Fixo
                        </button>
                      </div>
                    </div>

                    {calculationType === 'percentage' ? (
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">
                            Valor Total da Dívida (R$) <span style={{ color: 'var(--danger-color)' }}>*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '100%' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>R$</span>
                              <input
                                type="text"
                                className="form-input"
                                value={totalDebt > 0 ? formatCurrencyInput(totalDebt) : ''}
                                onChange={e => setTotalDebt(parseCurrencyInput(e.target.value))}
                                placeholder="0,00"
                                style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1E293B', paddingLeft: '2.5rem' }}
                              />
                            </div>
                          </div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                            Este valor será usado para calcular a duração da penhora.
                          </small>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Percentual do Ofício (%)</label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="form-input"
                              value={percentage}
                              onChange={e => setPercentage(Number(e.target.value))}
                              min="1" max="100"
                              style={{ fontSize: '1.2rem', fontWeight: 'bold' }}
                            />
                          </div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                            O sistema vinculas esse percentual base à Rubrica 8014.
                          </small>
                        </div>
                      </div>
                    ) : (
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">
                            Valor Total da Dívida (R$) <span style={{ color: 'var(--danger-color)' }}>*</span>
                          </label>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <div style={{ position: 'relative', width: '100%' }}>
                              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>R$</span>
                              <input
                                type="text"
                                className="form-input"
                                value={totalDebt > 0 ? formatCurrencyInput(totalDebt) : ''}
                                onChange={e => setTotalDebt(parseCurrencyInput(e.target.value))}
                                placeholder="0,00"
                                style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1E293B', paddingLeft: '2.5rem' }}
                              />
                            </div>
                          </div>
                          <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.35rem', display: 'block' }}>
                            Este valor será usado para calcular a duração da penhora.
                          </small>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Valor Fixo da Parcela (R$)</label>
                          <div style={{ position: 'relative', width: '100%' }}>
                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 'bold' }}>R$</span>
                            <input
                              type="text"
                              className="form-input"
                              value={fixedValue > 0 ? formatCurrencyInput(fixedValue) : ''}
                              onChange={e => setFixedValue(parseCurrencyInput(e.target.value))}
                              placeholder="0,00"
                              style={{ fontSize: '1.2rem', fontWeight: 'bold', paddingLeft: '2.5rem' }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div 
                      className="form-group" 
                      style={{ 
                        marginTop: '0.5rem', 
                        marginBottom: '1.5rem', 
                        padding: '1rem', 
                        background: 'var(--surface-default)', 
                        borderRadius: '6px', 
                        border: '1px solid var(--panel-border)',
                        opacity: calculationType === 'fixed' ? 0.5 : 1,
                        pointerEvents: calculationType === 'fixed' ? 'none' : 'auto',
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Incidência sobre Verbas Variáveis</label>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div
                          className={`bond-item ${incide13 ? 'selected' : ''}`}
                          onClick={() => setIncide13(!incide13)}
                          style={{ padding: '0.5rem 0.75rem', position: 'relative' }}
                        >
                          <div className="checkbox-custom">
                            {incide13 && <Check size={12} color="white" />}
                          </div>
                          <div className="bond-info">
                            <div className="bond-title" style={{ fontSize: '0.8rem' }}>13º Salário</div>
                          </div>
                        </div>

                        <div
                          className={`bond-item ${incideFerias ? 'selected' : ''}`}
                          onClick={() => setIncideFerias(!incideFerias)}
                          style={{ padding: '0.5rem 0.75rem', position: 'relative' }}
                        >
                          <div className="checkbox-custom">
                            {incideFerias && <Check size={12} color="white" />}
                          </div>
                          <div className="bond-info">
                            <div className="bond-title" style={{ fontSize: '0.8rem' }}>Férias + 1/3 Constitucional</div>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--panel-border)' }}>
                        <div className="calc-row" style={{ padding: '0 0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base de Origem:</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>R$ {totals.gross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div
                          className={`bond-item ${deductPrev ? 'selected' : ''}`}
                          onClick={() => setDeductPrev(!deductPrev)}
                          style={{ padding: '0.5rem 0.75rem' }}
                        >
                          <div className="checkbox-custom">
                            {deductPrev && <Check size={12} color="white" />}
                          </div>
                          <div className="bond-info">
                            <div className="bond-title" style={{ fontSize: '0.8rem' }}>INSS / Previdência</div>
                          </div>
                          <div className="bond-salary">
                            <div className="bond-gross" style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>- R$ {totals.prev.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          </div>
                        </div>

                        {totals.pensao > 0 && (
                          <div
                            className={`bond-item ${deductPensao ? 'selected' : ''}`}
                            onClick={() => setDeductPensao(!deductPensao)}
                            style={{ padding: '0.5rem 0.75rem' }}
                          >
                            <div className="checkbox-custom">
                              {deductPensao && <Check size={12} color="white" />}
                            </div>
                            <div className="bond-info">
                              <div className="bond-title" style={{ fontSize: '0.8rem' }}>Pensão Alimentícia</div>
                            </div>
                            <div className="bond-salary">
                              <div className="bond-gross" style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>- R$ {totals.pensao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                          </div>
                        )}

                        <div
                          className={`bond-item ${deductIRRF ? 'selected' : ''}`}
                          onClick={() => setDeductIRRF(!deductIRRF)}
                          style={{ padding: '0.5rem 0.75rem' }}
                        >
                          <div className="checkbox-custom">
                            {deductIRRF && <Check size={12} color="white" />}
                          </div>
                          <div className="bond-info">
                            <div className="bond-title" style={{ fontSize: '0.8rem' }}>Imposto de Renda (IRRF)</div>
                          </div>
                          <div className="bond-salary">
                            <div className="bond-gross" style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>- R$ {totals.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                          </div>
                        </div>

                        {totals.outrasPenhoras > 0 && (
                          <div
                            className={`bond-item ${deductOutras ? 'selected' : ''}`}
                            onClick={() => setDeductOutras(!deductOutras)}
                            style={{ padding: '0.5rem 0.75rem' }}
                          >
                            <div className="checkbox-custom">
                              {deductOutras && <Check size={12} color="white" />}
                            </div>
                            <div className="bond-info">
                              <div className="bond-title" style={{ fontSize: '0.8rem' }}>Penhoras Anteriores</div>
                            </div>
                            <div className="bond-salary">
                              <div className="bond-gross" style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>- R$ {totals.outrasPenhoras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                            </div>
                          </div>
                        )}



                        <div className="calc-row total" style={{ marginTop: '0.5rem', borderTop: '1px dashed var(--panel-border)', paddingTop: '0.75rem', paddingLeft: '0.75rem', paddingRight: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem' }}><strong>Base Líquida Final:</strong></span>
                          <span style={{ fontSize: '0.85rem' }}><strong>R$ {totals.net.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                        </div>

                        <div className="calc-row final-discount" style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.9rem' }}>
                            <strong>Parcela ({calculationType === 'percentage' ? `${percentage}%` : 'Fixo'}):</strong>
                          </span>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                            R$ {finalDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="action-bar">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setActiveScreen('list')}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSaving ? 0.7 : 1 }}
                        onClick={handleSave}
                        disabled={isSaving || !cpfServidor || selectedBonds.length === 0 || !totalDebt || totalDebt <= 0}
                      >
                        {isSaving ? (
                          <>Processando...</>
                        ) : (
                          <>
                            <Save size={16} />
                            Lançar Penhora
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <header className="page-header">
                <h1 className="page-title">Gestão de Penhoras Judiciais</h1>

              </header>

              <div className="card" style={{ padding: '0.75rem 1.25rem', marginBottom: '1rem', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>Filtro</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Filtro"
                      style={{ height: '36px', fontSize: '0.85rem', background: 'white' }}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#3B82F6' }}
                    onClick={() => setSearchQuery('')}
                  >
                    <RotateCcw size={14} />
                    Limpar Filtro
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1.5rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3B82F6', border: 'none', padding: '0.6rem 2rem', fontWeight: 600 }}
                  onClick={() => { resetCalc(); setActiveScreen('form'); }}
                >
                  <Plus size={18} />
                  Adicionar
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(groupedPenhoras).map(([servidor, penhoras]) => {
                  const isExpanded = expandedServers.includes(servidor);
                  const cpf = penhoras[0].cpf;
                  return (
                    <div key={servidor} className="card" style={{ padding: 0, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                      {/* Server Header */}
                      <div
                        style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'white' }}
                        onClick={() => toggleServerExpand(servidor)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', textTransform: 'uppercase' }}>
                            {servidor} - {cpf} <span style={{ color: '#2563EB', fontWeight: 600, marginLeft: '0.5rem', background: '#EFF6FF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{penhoras.length} penhoras</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>

                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: isExpanded ? '#F1F5F9' : 'white',
                            transition: 'all 0.2s'
                          }}>
                            {isExpanded ? <ChevronDown size={18} color="#2563EB" /> : <ChevronRight size={18} color="#64748B" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div style={{ borderTop: '1px solid #F1F5F9' }}>
                          {/* Inner Search/Filter Bar */}
                          <div style={{ padding: '1rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Processo, Vara Judicial</label>
                                <div style={{ position: 'relative' }}>
                                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                                  <input type="text" className="form-input" placeholder="Digite para buscar" style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.85rem' }} />
                                </div>
                              </div>
                              <div style={{ width: '180px', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Status</label>
                                <select className="form-input" style={{ height: '36px', fontSize: '0.85rem' }}>
                                  <option>Selecione...</option>
                                  <option>Ativo</option>
                                  <option>Encerrado</option>
                                  <option>Inativo</option>
                                </select>
                              </div>
                              <button className="btn btn-primary" style={{ height: '36px', fontSize: '0.8rem', padding: '0 15px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3B82F6' }}>
                                <Menu size={16} />
                                Limpar Filtro
                              </button>
                            </div>
                          </div>

                          <div className="table-responsive-container">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ background: 'white', borderBottom: '1px solid #F1F5F9', textAlign: 'left' }}>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569' }}>Processo</th>
                                <th style={{ padding: '1rem 1rem', fontWeight: 700, color: '#475569' }}>Vara Judicial</th>
                                <th style={{ padding: '1rem 1rem', fontWeight: 700, color: '#475569' }}>Base de Cálculo</th>

                                <th style={{ padding: '1rem 1rem', fontWeight: 700, color: '#475569' }}>Data Início</th>
                                <th style={{ padding: '1rem 1rem', fontWeight: 700, color: '#475569' }}>Data Término</th>
                                <th style={{ padding: '1rem 1rem', fontWeight: 700, color: '#475569' }}>Situação</th>
                                <th style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Ações</th>
                              </tr>
                            </thead>
                            <tbody>
                              {penhoras.map((item, idx) => (
                                <tr
                                  key={item.id}
                                  style={{ borderBottom: idx === penhoras.length - 1 ? 'none' : '1px solid #F1F5F9', background: idx % 2 === 0 ? 'white' : '#F8FAFC' }}
                                >
                                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{item.processo}</td>
                                  <td style={{ padding: '1rem 1rem' }}>{item.vara}</td>
                                  <td style={{ padding: '1rem 1rem' }}>
                                    <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: '4px',
                                        background: item.tipo === 'Porcentagem' ? '#EEF2FF' : '#F1F5F9',
                                        color: item.tipo === 'Porcentagem' ? '#4338CA' : '#475569',
                                        border: '1px solid currentColor',
                                        fontWeight: 700
                                      }}>
                                        {item.tipo === 'Fixo' ? 'VALOR FIXO' : 'PORCENTAGEM'}
                                      </span>
                                    </div>
                                  </td>

                                  <td style={{ padding: '1rem 1rem' }}>{formatDateBR(item.dataInicio)}</td>
                                  <td style={{ padding: '1rem 1rem' }}>{formatDateBR(item.dataTermino)}</td>
                                  <td style={{ padding: '1rem 1rem' }}>
                                    <span style={{
                                      padding: '0.25rem 0.75rem',
                                      borderRadius: '999px',
                                      fontSize: '0.7rem',
                                      fontWeight: 700,
                                      background: item.status === 'Ativo' ? '#DCFCE7' : item.status === 'Encerrado' ? '#F1F5F9' : '#FEE2E2',
                                      color: item.status === 'Ativo' ? '#166534' : item.status === 'Encerrado' ? '#475569' : '#991B1B'
                                    }}>
                                      {item.status.toUpperCase()}
                                    </span>
                                  </td>

                                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                    <div className="split-btn-group" style={{ position: 'relative', display: 'inline-flex' }}>
                                      <button
                                        className="btn btn-primary split-btn-main"
                                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, padding: '5px 12px', height: '30px', background: '#1E88E5', border: 'none', display: 'flex', alignItems: 'center' }}
                                        onClick={(e) => { e.stopPropagation(); setViewingPenhora(item); setOpenDropdownId(null); }}
                                        title="Visualizar"
                                      >
                                        <Eye size={16} />
                                      </button>
                                      <button
                                        className="btn btn-primary split-btn-trigger"
                                        style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0, padding: '5px 6px', height: '30px', background: '#1E88E5', border: 'none', borderLeft: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center' }}
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setOpenDropdownId(openDropdownId === item.id ? null : item.id); 
                                        }}
                                      >
                                        <ChevronDown size={14} />
                                      </button>

                                      {openDropdownId === item.id && (
                                        <div className="action-dropdown-menu" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '4px', background: 'white', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', zIndex: 50, minWidth: '130px', display: 'flex', flexDirection: 'column', border: '1px solid #E2E8F0', padding: '4px 0' }}>
                                          <button 
                                            className="dropdown-item" 
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', width: '100%', textAlign: 'left', background: 'transparent', border: 'none', color: '#475569', fontSize: '0.85rem', cursor: 'pointer' }}
                                            onClick={(e) => { e.stopPropagation(); handleEdit(item); setOpenDropdownId(null); }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#F1F5F9'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                          >
                                            <Pencil size={14} color="#64748B" /> Editar
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {viewingPenhora && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              <button
                onClick={() => setViewingPenhora(null)}
                style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={24} />
              </button>

              <h2 className="card-title" style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                <Gavel size={20} />
                Detalhes da Penhora Judicial
              </h2>

              <div className="modal-grid">
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Dados do Processo</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>SERVIDOR / DEVEDOR</label>
                      <div style={{ fontWeight: 600 }}>{viewingPenhora.servidor}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{viewingPenhora.cpf}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>PROCESSO JUDICIAL</label>
                      <div style={{ fontWeight: 600 }}>{viewingPenhora.processo}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B' }}>{viewingPenhora.vara}</div>
                    </div>
                    <div className="modal-inner-grid">
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>DATA INÍCIO</label>
                        <div style={{ fontWeight: 600 }}>{viewingPenhora.dataInicio}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>DATA TÉRMINO</label>
                        <div style={{ fontWeight: 600 }}>{viewingPenhora.dataTermino || '-'}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>RUBRICA</label>
                        <div style={{ fontWeight: 600 }}>8014 - O.J.</div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.7rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>SITUAÇÃO</label>
                        <div style={{ fontWeight: 600, color: viewingPenhora.status === 'Ativo' ? '#059669' : viewingPenhora.status === 'Inativo' ? '#991B1B' : '#64748B' }}>
                          {viewingPenhora.status}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.025em', marginTop: '2rem' }}>Vínculos Atingidos</h3>
                  <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <Check size={14} color="#15803D" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Professor - SEDUC (Efetivo)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Check size={14} color="#15803D" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Técnico Administrativo - SES (Interino)</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#F1F5F9', padding: '1.5rem', borderRadius: '12px', border: '1px solid #CBD5E1' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', marginBottom: '1.5rem', textAlign: 'center' }}>MEMÓRIA DE CÁLCULO</h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span>Soma Brutos:</span>
                      <span style={{ fontWeight: 600 }}>R$ 14.500,00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#EF4444' }}>
                      <span>Deduções Legais:</span>
                      <span>- R$ 3.840,00</span>
                    </div>
                    <div style={{ margin: '0.5rem 0', borderTop: '1px dashed #CBD5E1' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                      <span>BASE LÍQUIDA:</span>
                      <span>R$ 10.660,00</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '1rem' }}>
                      <span>Calculado ({viewingPenhora.valor} - {viewingPenhora.tipo}):</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                        {viewingPenhora.tipo === 'Fixo' ? viewingPenhora.valor : 'R$ 3.198,00'}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '2rem', padding: '1rem', background: 'white', borderRadius: '8px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginBottom: '0.25rem' }}>STATUS DA ORDEM</div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: viewingPenhora.status === 'Ativo' ? '#DCFCE7' : '#F1F5F9',
                      color: viewingPenhora.status === 'Ativo' ? '#15803D' : '#475569'
                    }}>
                      {viewingPenhora.status === 'Ativo' ? 'LANÇAMENTO EM FOLHA' : 'ENCERRADO'}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setViewingPenhora(null)}
                >
                  Fechar
                </button>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3B82F6' }}
                  onClick={() => {
                    const dataToPrint = viewingPenhora;
                    alert(`Imprimindo comprovante de: ${dataToPrint.servidor}`);
                  }}
                >
                  <Save size={16} />
                  Imprimir Comprovante
                </button>
                <button
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0F172A' }}
                  onClick={() => handleEdit(viewingPenhora)}
                >
                  <Pencil size={16} />
                  Editar Penhora
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer exactly as requested */}
        <div className="footer">
          SEPLAG - STI - Coordenadoria de Sistemas
        </div>
        {/* Payoff Modal */}
        {showPayoffModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', border: '2px solid #FECACA' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ background: '#FEE2E2', color: '#EF4444', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <Calculator size={32} />
                </div>
                <h2 style={{ fontSize: '1.25rem', color: '#991B1B', fontWeight: 700 }}>Quitação Antecipada</h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.5rem' }}>Informe os dados para encerrar esta penhora por adiantamento.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#991B1B' }}>Valor Pago para Quitação (R$)</label>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#991B1B', fontWeight: 'bold' }}>R$</span>
                    <input
                      type="text"
                      className="form-input"
                      value={earlyPayoffValue > 0 ? formatCurrencyInput(earlyPayoffValue) : ''}
                      onChange={e => setEarlyPayoffValue(parseCurrencyInput(e.target.value))}
                      placeholder="0,00"
                      autoFocus
                      style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#991B1B', paddingLeft: '3rem', borderColor: '#FECACA', background: '#FFF7F7' }}
                    />
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: '#FEF2F2', padding: '0.75rem', borderRadius: '8px', border: '1px solid #FECACA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#991B1B' }}>
                      <span>Dívida Atual:</span>
                      <strong>R$ {totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                    </div>
                    {earlyPayoffValue > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#B91C1C' }}>
                          <span>Novo Saldo:</span>
                          <strong>R$ {Math.max(0, totalDebt - earlyPayoffValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#B91C1C', paddingTop: '0.25rem', borderTop: '1px dashed #FECACA' }}>
                          <span>Nova Previsão de Término:</span>
                          <strong>
                            {(() => {
                              const remaining = Math.max(0, totalDebt - earlyPayoffValue);
                              if (remaining === 0) return 'IMEDIATO';
                              
                              const parcel = calculationType === 'percentage' ? (totals.net * (percentage / 100)) : fixedValue;
                              if (parcel <= 0) return '-';
                              
                              const months = Math.ceil(remaining / parcel);
                              const startDate = dataInicioForm ? new Date(dataInicioForm + 'T00:00:00') : new Date();
                              const endDate = new Date(startDate);
                              endDate.setMonth(startDate.getMonth() + months);
                              return endDate.toLocaleDateString('pt-BR');
                            })()}
                          </strong>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo / Observações</label>
                  <textarea 
                    className="form-textarea" 
                    rows={3} 
                    placeholder="Ex: Pagamento parcial efetuado via guia..."
                    value={payoffObservations}
                    onChange={(e) => setPayoffObservations(e.target.value)}
                  ></textarea>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setShowPayoffModal(false);
                      if (earlyPayoffValue === 0) setStatus('Ativo');
                    }}
                  >
                    Cancelar
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, background: '#EF4444', border: 'none' }}
                    onClick={() => {
                      if (earlyPayoffValue > 0) {
                        const remaining = Math.max(0, totalDebt - earlyPayoffValue);
                        
                        // If there is still debt, update totalDebt and let the main effect recalculate date
                        // and keep status as 'Ativo' if the user wants to continue?
                        // But the user selected 'Inativo'. If it's partial, maybe we should keep it 'Ativo'.
                        if (remaining > 0) {
                          setTotalDebt(remaining);
                          setStatus('Ativo');
                          alert(`Amortização realizada! Novo saldo devedor: R$ ${remaining.toLocaleString('pt-BR')}. A data de término será recalculada.`);
                        } else {
                          setStatus('Inativo');
                        }
                        
                        setShowPayoffModal(false);
                      } else {
                        alert('Por favor, informe o valor pago.');
                      }
                    }}
                  >
                    {totalDebt - earlyPayoffValue > 0 ? 'Confirmar Amortização' : 'Confirmar Quitação Total'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
