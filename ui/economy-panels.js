// Town accounts: where the town's money sits (council, Commonwealth, NSW, the bank, shops, people),
// what each business earned and paid, and the recent double-entry journal (src/world/finance.js).
import { esc } from './interactions.js';
import { JOB_BOARD, MAX_SHIFTS_PER_DAY } from '../world/jobs.js';

const d = (n) => '$' + Math.round(n || 0).toLocaleString('en-AU');

export function economyPanel(life, back) {
  const r = life.economyReport(), f = r.daily, t = r.lifetime;
  const biz = r.biz.map((b) => `<tr><td>${esc(b.name)}</td><td>${d(b.till)}</td><td>${d(b.sales)}</td><td>${d(b.wages)}</td><td>${d(b.rates + b.utilities)}</td><td>${d(b.result)}</td><td>${b.unpaid ? d(b.unpaid) : '–'}</td></tr>`).join('');
  const rows = r.entries.map((e) => `<tr><td>Day ${e.day}</td><td>${esc(e.memo)}</td><td>${esc(e.debit)} → ${esc(e.credit)}</td><td>${d(e.amount)}</td></tr>`).join('') || '<tr><td colspan="4">Nothing recorded yet</td></tr>';
  return {
    title: '📊 Town accounts', wide: true,
    body: `<p><b>Money in town:</b> ${d(r.total)} — all of it counted below. Money only moves between these pots; none is made from nothing.</p>
      <table class="ledger"><tr><th>Council</th><th>Commonwealth</th><th>NSW</th><th>Community bank pool</th><th>Shop tills</th><th>Villagers</th><th>You</th></tr>
      <tr><td>${d(r.council)}</td><td>${d(r.commonwealth)}</td><td>${d(r.nsw)}</td><td>${d(r.bank)}</td><td>${d(r.tills)}</td><td>${d(r.people)}</td><td>${d(r.visitor)}</td></tr></table>
      <h3>Today · lifetime</h3>
      <p>PAYG income tax to the Commonwealth: <b>${d(f.tax)}</b> · ${d(t.tax)}<br>
      NSW health and school wages: <b>${d(f.stateWages)}</b> · ${d(t.stateWages)} · council wages: <b>${d(f.councilWages)}</b> · ${d(t.councilWages)}<br>
      Business rates: <b>${d(f.rates)}</b> · ${d(t.rates)} · utilities: <b>${d(f.utilities)}</b> · ${d(t.utilities)} · household rent: <b>${d(f.rent)}</b> · ${d(t.rent)}<br>
      Grants to council: <b>${d(f.grants)}</b> · ${d(t.grants)}</p>
      <p>Owed and not yet paid: your rent ${d(r.rentArrears)} and power ${d(r.powerArrears)} · villagers' wage arrears ${d(r.wageArrears)} · villagers' rate arrears ${d(r.rateArrears)} · business bills ${d(f.unpaid)}.</p>
      <h3>Businesses</h3><table class="ledger"><tr><th>Business</th><th>Till</th><th>Sales</th><th>Wages paid</th><th>Rates + utilities</th><th>Result</th><th>Bills owed</th></tr>${biz}</table>
      <h3>Recent transfers</h3><table class="ledger"><tr><th>Day</th><th>What</th><th>From → to</th><th>Amount</th></tr>${rows}</table>
      <p class="dim">Fictional Town Dollars for a 24-minute day, not real Australian rates. Commonwealth and NSW grants last only while their treasuries do.</p>`,
    actions: back ? [{ label: 'Back', run: back }] : [],
  };
}

// The visitor's wallet: cash, savings, what is owed, recent receipts.
export function walletPanel(life, opts = {}) {
  const me = life.civic.player, r = life.economyReport(), j = life.jobsReport(), cr = life.creditReport();
  const rows = j.receipts.map((x) => `<tr><td>Day ${x.day}</td><td>${esc(x.text)}</td><td>${x.amount ? (x.amount > 0 ? '+' : '–') + d(Math.abs(x.amount)) : ''}</td></tr>`).join('') || '<tr><td colspan="3">No receipts yet</td></tr>';
  const bag = Object.entries(me.bag || {}).filter(([, n]) => n > 0).map(([k, n]) => `${esc(k)} × ${n}`).join(', ') || 'nothing yet';
  return {
    title: '💳 Wallet', wide: true,
    body: `<p><b>Wallet:</b> ${d(me.wallet)} · <b>Savings at the bank:</b> ${d(me.bank)} · <b>Total:</b> ${d(me.wallet + me.bank)}</p>
      <p><b>Earned from work and trading:</b> ${d(cr.earned)} · <b>Spent in shops:</b> ${d(j.spent)} · <b>Bag:</b> ${bag}</p>
      <p><b>Overdue:</b> rent ${d(r.rentArrears)}, power ${d(r.powerArrears)} · <b>Loan:</b> ${cr.loan ? d(cr.loan.owed) + ' owing, due day ' + cr.loan.due : 'none'}</p>
      <p class="dim">Rent $8 and power $2 come out each morning (from day 2), then PAYG tax is taken from wages. Bank counter: deposits, loans and bills.</p>
      <h3>Recent receipts</h3><table class="ledger"><tr><th>When</th><th>What</th><th>Change</th></tr>${rows}</table>`,
    actions: [
      { label: '💼 Paid jobs', run: () => jobBoardPanel(life, opts) },
      { label: '📊 Town accounts', run: () => economyPanel(life, () => walletPanel(life, opts)) },
    ],
  };
}

export function jobBoardPanel(life, opts = {}) {
  const j = life.jobsReport();
  const rows = JOB_BOARD.map((x) => {
    const p = life.place(x.site), done = j.doneToday.includes(x.id);
    return `<tr><td>${esc(x.name)}</td><td>${esc(p.name)}</td><td>${x.minutes} min</td><td>${d(x.pay)}</td><td>${done ? 'Done today' : life.open(p) ? 'Open' : 'Closed'}</td></tr>`;
  }).join('');
  return {
    title: '💼 Paid jobs', wide: true,
    body: `<p>Earn real wages by working a shift inside a workplace while its staff are on duty. Up to ${MAX_SHIFTS_PER_DAY} shifts a day, one of each. Wages come out of the employer's till (the council covers the rest) and PAYG income tax goes to the Commonwealth. Shifts count down only while you are inside.</p>
      <table class="ledger"><tr><th>Job</th><th>Where</th><th>Time</th><th>Pay</th><th>Today</th></tr>${rows}</table>
      ${j.active ? `<p><b>Current shift:</b> ${esc(JOB_BOARD.find((x) => x.id === j.active.id).name)} · ${Math.floor(j.active.worked)}/${j.active.required} town minutes</p>` : ''}`,
    actions: [
      ...(opts.go ? JOB_BOARD.map((x) => ({ label: `Go to ${life.place(x.site).name}`, run: () => { opts.go(x.site); return null; } })) : []),
      { label: '💳 Wallet', run: () => walletPanel(life, opts) },
    ],
  };
}

// The shift screen for one workplace, opened from its counter panel.
export function jobPanel(life, site, back) {
  const defs = JOB_BOARD.filter((x) => x.site === site), j = life.jobsReport(), a = j.active && j.active.site === site ? j.active : null;
  const p = life.place(site), sup = life.jobSupervisors(site);
  const flash = (msg) => { const pp = jobPanel(life, site, back); pp.body = `<p><b>${esc(msg)}</b></p>` + pp.body; return pp; };
  const def = a && JOB_BOARD.find((x) => x.id === a.id);
  let body = `<p><b>Employer:</b> ${esc(p.name)} · <b>Time:</b> ${esc(life.time())} · <b>On duty:</b> ${esc(sup.map((v) => v.name).join(', ') || 'no one right now')}</p>`;
  if (a) body += `<p><b>Current shift:</b> ${esc(def.name)} · ${Math.floor(a.worked)}/${a.required} town minutes worked · pays ${d(a.pay)}</p>
    <p><b>Duties:</b> ${def.tasks.map((k) => (a.tasks.includes(k) ? '✅ ' : '☐ ') + esc(k.replace(/-/g, ' '))).join(' · ')}</p>
    <p class="dim">Time only counts while you are in here and someone is on duty. Duties need five town minutes between them.</p>`;
  else body += `<p>No shift started. Shifts today: ${j.shiftsToday}/${MAX_SHIFTS_PER_DAY}.</p>`;
  const actions = [];
  if (a) {
    for (const k of def.tasks) if (!a.tasks.includes(k)) actions.push({ label: `Do: ${k.replace(/-/g, ' ')}`, run: () => flash(life.doTask(k).message) });
    actions.push({ label: a.worked >= a.required && a.tasks.length >= def.tasks.length ? `✅ Clock out and collect ${d(a.pay)}` : 'Check progress', run: () => flash(a.worked >= a.required && a.tasks.length >= def.tasks.length ? life.finishJob().message : `Keep working. ${Math.ceil(a.required - a.worked)} minutes to go.`) });
    actions.push({ label: 'Cancel shift (no wages)', run: () => flash(life.cancelJob().message) });
  } else for (const x of defs) actions.push({ label: `${x.name} · ${x.minutes} min · ${d(x.pay)}`, run: () => flash(life.startJob(x.id).message) });
  actions.push({ label: '💳 Wallet', run: () => walletPanel(life) });
  if (back) actions.push({ label: 'Back', run: back });
  return { title: `💼 Work at ${p.name}`, body, actions, wide: true };
}
