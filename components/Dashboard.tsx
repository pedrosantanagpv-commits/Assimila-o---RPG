'use client';

import { useMemo, useState } from 'react';
import { callAssimilacaoApi } from '@/lib/api';

type ABC = {
  a: number;
  b: number;
  c: number;
};

type Sessao = {
  id_sessao: string;
  nome_conflito: string;
  descricao: string;
  turno_atual: number;
  status: string;
};

type Participante = {
  id_participante: string;
  nome: string;
  tipo: string;
  status: string;
  gerado: ABC;
  alocado: ABC;
  falta_alocar: ABC;
};

type Destino = {
  id_destino: string;
  nome: string;
  categoria: string;
  dono_tipo: string;
  dono_nome: string;
  escopo: string;
  status: string;
  status_calculado: string;
  custo: ABC;
  alocado: ABC;
  faltam: ABC;
  excedente: ABC;
  observacao: string;
};

type Rolagem = {
  id_rolagem: string;
  turno: number;
  origem_id: string;
  origem_nome: string;
  origem_tipo: string;
  gerado: ABC;
  saldo: ABC;
  observacao: string;
  criado_em: string;
};

type ResumoSessao = {
  sessao: Sessao;
  participantes: Participante[];
  destinos: Destino[];
  rolagens: Rolagem[];
};

type ApiResult<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

const emptyABC: ABC = { a: 0, b: 0, c: 0 };

export default function Dashboard() {
  const [usuario, setUsuario] = useState('Mestre');
  const [idSessao, setIdSessao] = useState('');
  const [resumo, setResumo] = useState<ResumoSessao | null>(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const [novaSessao, setNovaSessao] = useState({
    nome_conflito: '',
    descricao: '',
  });

  const [participante, setParticipante] = useState({
    nome: '',
    tipo: 'JOGADOR',
  });

  const [destino, setDestino] = useState({
    nome: '',
    categoria: 'OBJETIVO_PRINCIPAL',
    dono_tipo: 'JOGADOR',
    dono_nome: 'Todos',
    custo_a: 0,
    custo_b: 0,
    custo_c: 0,
    escopo: 'GLOBAL',
    observacao: '',
  });

  const [rolagem, setRolagem] = useState({
    origem_id: '',
    a_total: 0,
    b_total: 0,
    c_total: 0,
    observacao: '',
  });

  const [alocacao, setAlocacao] = useState({
    id_rolagem: '',
    destino_id: '',
    a: 0,
    b: 0,
    c: 0,
    observacao: '',
  });

  const participantesAtivos = resumo?.participantes || [];
  const rolagensComSaldo = resumo?.rolagens || [];
  const destinosAtivos = resumo?.destinos || [];

  const rolagemSelecionada = useMemo(() => {
    return rolagensComSaldo.find((r) => r.id_rolagem === alocacao.id_rolagem);
  }, [rolagensComSaldo, alocacao.id_rolagem]);

  async function execute<T = unknown>(
    action: string,
    payload: Record<string, unknown>,
    onSuccess?: (data: T) => void
  ) {
    try {
      setLoading(true);
      setMensagem('');

      const result = await callAssimilacaoApi<T>(action, payload, usuario);

      if (!result.success) {
        setMensagem(result.message || 'Ação não concluída.');
        return;
      }

      setMensagem('Ação realizada com sucesso.');
      onSuccess?.(result.data as T);
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : 'Erro inesperado.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarResumo(sessaoId = idSessao) {
    if (!sessaoId) {
      setMensagem('Informe o ID da sessão.');
      return;
    }

    await execute<ResumoSessao>('getResumoSessao', { id_sessao: sessaoId }, (data) => {
      setResumo(data);
      setIdSessao(data.sessao.id_sessao);
    });
  }

  async function criarSessao() {
    await execute<Sessao>('criarSessao', {
      nome_conflito: novaSessao.nome_conflito,
      descricao: novaSessao.descricao,
      turno_atual: 1,
    }, (data) => {
      setIdSessao(data.id_sessao);
      setNovaSessao({ nome_conflito: '', descricao: '' });
      carregarResumo(data.id_sessao);
    });
  }

  async function adicionarParticipante() {
    await execute('adicionarParticipante', {
      id_sessao: idSessao,
      nome: participante.nome,
      tipo: participante.tipo,
    }, () => {
      setParticipante({ nome: '', tipo: 'JOGADOR' });
      carregarResumo();
    });
  }

  async function criarDestino() {
    await execute('criarDestino', {
      id_sessao: idSessao,
      ...destino,
    }, () => {
      setDestino({
        nome: '',
        categoria: 'OBJETIVO_PRINCIPAL',
        dono_tipo: 'JOGADOR',
        dono_nome: 'Todos',
        custo_a: 0,
        custo_b: 0,
        custo_c: 0,
        escopo: 'GLOBAL',
        observacao: '',
      });
      carregarResumo();
    });
  }

  async function registrarRolagem() {
    const origem = participantesAtivos.find((p) => p.id_participante === rolagem.origem_id);

    if (!origem || !resumo) {
      setMensagem('Selecione um participante válido.');
      return;
    }

    await execute('registrarRolagem', {
      id_sessao: idSessao,
      turno: resumo.sessao.turno_atual,
      origem_id: origem.id_participante,
      origem_nome: origem.nome,
      origem_tipo: origem.tipo,
      a_total: Number(rolagem.a_total),
      b_total: Number(rolagem.b_total),
      c_total: Number(rolagem.c_total),
      observacao: rolagem.observacao,
    }, () => {
      setRolagem({
        origem_id: '',
        a_total: 0,
        b_total: 0,
        c_total: 0,
        observacao: '',
      });
      carregarResumo();
    });
  }

  async function alocarPontos() {
    await execute('alocarPontos', {
      id_rolagem: alocacao.id_rolagem,
      destino_id: alocacao.destino_id,
      a: Number(alocacao.a),
      b: Number(alocacao.b),
      c: Number(alocacao.c),
      observacao: alocacao.observacao,
    }, () => {
      setAlocacao({
        id_rolagem: '',
        destino_id: '',
        a: 0,
        b: 0,
        c: 0,
        observacao: '',
      });
      carregarResumo();
    });
  }

  async function avancarTurno() {
    await execute('avancarTurno', { id_sessao: idSessao }, () => carregarResumo());
  }

  async function encerrarDestino(id_destino: string) {
    await execute('encerrarDestino', { id_destino }, () => carregarResumo());
  }

  return (
    <main className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Assimilação RPG</p>
          <h1>Controle de Tracking</h1>
          <p>
            Registre pontos rolados, acompanhe saldo e veja onde cada ponto foi alocado.
          </p>
        </div>

        <div className="heroCard">
          <label>Usuário</label>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} />

          <label>ID da sessão</label>
          <div className="inline">
            <input
              value={idSessao}
              onChange={(e) => setIdSessao(e.target.value)}
              placeholder="SES_..."
            />
            <button disabled={loading} onClick={() => carregarResumo()}>
              Carregar
            </button>
          </div>
        </div>
      </header>

      {mensagem && <div className="message">{mensagem}</div>}

      <section className="grid two">
        <Card title="Criar sessão">
          <input
            placeholder="Nome do conflito"
            value={novaSessao.nome_conflito}
            onChange={(e) => setNovaSessao({ ...novaSessao, nome_conflito: e.target.value })}
          />
          <textarea
            placeholder="Descrição"
            value={novaSessao.descricao}
            onChange={(e) => setNovaSessao({ ...novaSessao, descricao: e.target.value })}
          />
          <button disabled={loading || !novaSessao.nome_conflito} onClick={criarSessao}>
            Criar sessão
          </button>
        </Card>

        <Card title="Sessão atual">
          {resumo ? (
            <>
              <Info label="Conflito" value={resumo.sessao.nome_conflito} />
              <Info label="ID" value={resumo.sessao.id_sessao} />
              <Info label="Turno" value={String(resumo.sessao.turno_atual)} />
              <Info label="Status" value={resumo.sessao.status} />
              <button disabled={loading} onClick={avancarTurno}>
                Avançar turno
              </button>
            </>
          ) : (
            <p className="muted">Crie ou carregue uma sessão para começar.</p>
          )}
        </Card>
      </section>

      {resumo && (
        <>
          <section className="grid two">
            <Card title="Adicionar participante">
              <input
                placeholder="Nome"
                value={participante.nome}
                onChange={(e) => setParticipante({ ...participante, nome: e.target.value })}
              />
              <select
                value={participante.tipo}
                onChange={(e) => setParticipante({ ...participante, tipo: e.target.value })}
              >
                <option value="JOGADOR">JOGADOR</option>
                <option value="NARRADOR">NARRADOR</option>
                <option value="AMEACA">AMEAÇA</option>
              </select>
              <button disabled={loading || !participante.nome} onClick={adicionarParticipante}>
                Adicionar
              </button>
            </Card>

            <Card title="Criar destino">
              <input
                placeholder="Nome do objetivo ou ativação"
                value={destino.nome}
                onChange={(e) => setDestino({ ...destino, nome: e.target.value })}
              />

              <div className="inline">
                <select
                  value={destino.categoria}
                  onChange={(e) => setDestino({ ...destino, categoria: e.target.value })}
                >
                  <option value="OBJETIVO_PRINCIPAL">OBJETIVO PRINCIPAL</option>
                  <option value="OBJETIVO_SECUNDARIO">OBJETIVO SECUNDÁRIO</option>
                  <option value="ATIVACAO_CONFLITO">ATIVAÇÃO DO CONFLITO</option>
                  <option value="ATIVACAO_AMEACA">ATIVAÇÃO DE AMEAÇA</option>
                  <option value="NEUTRALIZACAO">NEUTRALIZAÇÃO</option>
                  <option value="OUTRO">OUTRO</option>
                </select>

                <select
                  value={destino.escopo}
                  onChange={(e) => setDestino({ ...destino, escopo: e.target.value })}
                >
                  <option value="GLOBAL">GLOBAL</option>
                  <option value="POR_JOGADOR">POR JOGADOR</option>
                  <option value="POR_AMEACA">POR AMEAÇA</option>
                </select>
              </div>

              <div className="abcInputs">
                <NumberField label="Custo A" value={destino.custo_a} onChange={(v) => setDestino({ ...destino, custo_a: v })} />
                <NumberField label="Custo B" value={destino.custo_b} onChange={(v) => setDestino({ ...destino, custo_b: v })} />
                <NumberField label="Custo C" value={destino.custo_c} onChange={(v) => setDestino({ ...destino, custo_c: v })} />
              </div>

              <textarea
                placeholder="Observação"
                value={destino.observacao}
                onChange={(e) => setDestino({ ...destino, observacao: e.target.value })}
              />

              <button disabled={loading || !destino.nome} onClick={criarDestino}>
                Criar destino
              </button>
            </Card>
          </section>

          <section className="grid two">
            <Card title="Registrar rolagem">
              <select
                value={rolagem.origem_id}
                onChange={(e) => setRolagem({ ...rolagem, origem_id: e.target.value })}
              >
                <option value="">Selecione quem rolou</option>
                {participantesAtivos.map((p) => (
                  <option key={p.id_participante} value={p.id_participante}>
                    {p.nome} — {p.tipo}
                  </option>
                ))}
              </select>

              <div className="abcInputs">
                <NumberField label="A" value={rolagem.a_total} onChange={(v) => setRolagem({ ...rolagem, a_total: v })} />
                <NumberField label="B" value={rolagem.b_total} onChange={(v) => setRolagem({ ...rolagem, b_total: v })} />
                <NumberField label="C" value={rolagem.c_total} onChange={(v) => setRolagem({ ...rolagem, c_total: v })} />
              </div>

              <textarea
                placeholder="Observação"
                value={rolagem.observacao}
                onChange={(e) => setRolagem({ ...rolagem, observacao: e.target.value })}
              />

              <button disabled={loading || !rolagem.origem_id} onClick={registrarRolagem}>
                Registrar rolagem
              </button>
            </Card>

            <Card title="Alocar pontos">
              <select
                value={alocacao.id_rolagem}
                onChange={(e) => setAlocacao({ ...alocacao, id_rolagem: e.target.value })}
              >
                <option value="">Selecione a rolagem</option>
                {rolagensComSaldo.map((r) => (
                  <option key={r.id_rolagem} value={r.id_rolagem}>
                    T{r.turno} — {r.origem_nome} — saldo {formatABC(r.saldo)}
                  </option>
                ))}
              </select>

              {rolagemSelecionada && (
                <p className="muted">Disponível: {formatABC(rolagemSelecionada.saldo)}</p>
              )}

              <select
                value={alocacao.destino_id}
                onChange={(e) => setAlocacao({ ...alocacao, destino_id: e.target.value })}
              >
                <option value="">Selecione o destino</option>
                {destinosAtivos.map((d) => (
                  <option key={d.id_destino} value={d.id_destino}>
                    {d.nome} — falta {formatABC(d.faltam)}
                  </option>
                ))}
              </select>

              <div className="abcInputs">
                <NumberField label="A" value={alocacao.a} onChange={(v) => setAlocacao({ ...alocacao, a: v })} />
                <NumberField label="B" value={alocacao.b} onChange={(v) => setAlocacao({ ...alocacao, b: v })} />
                <NumberField label="C" value={alocacao.c} onChange={(v) => setAlocacao({ ...alocacao, c: v })} />
              </div>

              <textarea
                placeholder="Observação"
                value={alocacao.observacao}
                onChange={(e) => setAlocacao({ ...alocacao, observacao: e.target.value })}
              />

              <button
                disabled={loading || !alocacao.id_rolagem || !alocacao.destino_id}
                onClick={alocarPontos}
              >
                Alocar pontos
              </button>
            </Card>
          </section>

          <section className="grid two">
            <Card title="Participantes">
              <div className="list">
                {participantesAtivos.map((p) => (
                  <div key={p.id_participante} className="item">
                    <div>
                      <strong>{p.nome}</strong>
                      <span>{p.tipo}</span>
                    </div>
                    <div className="chips">
                      <Chip label="Gerado" value={formatABC(p.gerado)} />
                      <Chip label="Alocado" value={formatABC(p.alocado)} />
                      <Chip label="Falta" value={formatABC(p.falta_alocar)} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Destinos / progresso">
              <div className="list">
                {destinosAtivos.map((d) => (
                  <div key={d.id_destino} className="item">
                    <div>
                      <strong>{d.nome}</strong>
                      <span>{d.categoria} · {d.status_calculado}</span>
                      {d.observacao && <small>{d.observacao}</small>}
                    </div>
                    <div className="chips">
                      <Chip label="Custo" value={formatABC(d.custo)} />
                      <Chip label="Alocado" value={formatABC(d.alocado)} />
                      <Chip label="Falta" value={formatABC(d.faltam)} />
                    </div>
                    {d.status_calculado === 'completo' && d.status !== 'resolvido' && (
                      <button className="secondary" onClick={() => encerrarDestino(d.id_destino)}>
                        Marcar resolvido
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </section>

          <section>
            <Card title="Rolagens">
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Turno</th>
                      <th>Origem</th>
                      <th>Tipo</th>
                      <th>Gerado</th>
                      <th>Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolagensComSaldo.map((r) => (
                      <tr key={r.id_rolagem}>
                        <td>{r.turno}</td>
                        <td>{r.origem_nome}</td>
                        <td>{r.origem_tipo}</td>
                        <td>{formatABC(r.gerado)}</td>
                        <td>{formatABC(r.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      )}

      <style jsx>{`
        .page {
          width: min(1180px, calc(100% - 32px));
          margin: 0 auto;
          padding: 32px 0 64px;
        }

        .hero {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 24px;
          align-items: stretch;
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: var(--accent-2);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 12px;
          font-weight: 700;
        }

        h1 {
          font-size: clamp(36px, 7vw, 72px);
          line-height: 0.95;
          margin: 0 0 16px;
        }

        .hero p {
          color: var(--muted);
          max-width: 620px;
        }

        .heroCard {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .grid {
          display: grid;
          gap: 20px;
          margin: 20px 0;
        }

        .two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .message {
          background: rgba(226, 184, 102, 0.13);
          border: 1px solid rgba(226, 184, 102, 0.3);
          border-radius: 14px;
          padding: 12px 14px;
          margin: 16px 0;
        }

        .inline {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        .abcInputs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid var(--line);
          background: rgba(0, 0, 0, 0.22);
          color: var(--text);
          border-radius: 12px;
          padding: 11px 12px;
          outline: none;
        }

        textarea {
          min-height: 78px;
          resize: vertical;
        }

        label {
          color: var(--muted);
          font-size: 13px;
        }

        button {
          border: 0;
          background: linear-gradient(135deg, var(--accent), var(--accent-2));
          color: #1b1510;
          border-radius: 12px;
          padding: 11px 14px;
          font-weight: 800;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text);
          border: 1px solid var(--line);
        }

        .muted {
          color: var(--muted);
        }

        .list {
          display: grid;
          gap: 12px;
        }

        .item {
          display: grid;
          gap: 10px;
          background: rgba(0, 0, 0, 0.16);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 14px;
        }

        .item strong {
          display: block;
          margin-bottom: 4px;
        }

        .item span,
        .item small {
          display: block;
          color: var(--muted);
        }

        .chips {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .tableWrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          text-align: left;
          border-bottom: 1px solid var(--line);
          padding: 12px;
          color: var(--muted);
        }

        th {
          color: var(--text);
        }

        @media (max-width: 820px) {
          .hero,
          .two {
            grid-template-columns: 1fr;
          }

          .inline {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      <div className="content">{children}</div>

      <style jsx>{`
        .card {
          background: rgba(255, 255, 255, 0.055);
          border: 1px solid var(--line);
          border-radius: 22px;
          padding: 20px;
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22);
        }

        h2 {
          margin: 0 0 16px;
          font-size: 20px;
        }

        .content {
          display: grid;
          gap: 12px;
        }
      `}</style>
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info">
      <span>{label}</span>
      <strong>{value}</strong>

      <style jsx>{`
        .info {
          display: grid;
          gap: 3px;
        }

        span {
          color: var(--muted);
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="chip">
      <small>{label}</small>
      <strong>{value}</strong>

      <style jsx>{`
        .chip {
          display: inline-flex;
          gap: 6px;
          align-items: center;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 6px 10px;
        }

        small {
          color: var(--muted);
        }

        strong {
          color: var(--text);
        }
      `}</style>
    </span>
  );
}

function formatABC(value: ABC = emptyABC) {
  return `${Number(value.a || 0)}A | ${Number(value.b || 0)}B | ${Number(value.c || 0)}C`;
}
