import { createInitialState, describeLocation, executeCommand, getStatus, isValidState } from './engine.mjs';

const STORAGE_KEY = 'textgame-save-v1';
const output = document.querySelector('#output');
const form = document.querySelector('#command-form');
const input = document.querySelector('#command');
const quick = document.querySelector('#quick-actions');
const undoButton = document.querySelector('#undo');
const resetButton = document.querySelector('#reset');
const chips = {
  location: document.querySelector('#location-chip'),
  health: document.querySelector('#health-chip'),
  stamina: document.querySelector('#stamina-chip'),
  turns: document.querySelector('#turns-chip'),
};
const discoveredList = document.querySelector('#discovered-list');

let state = loadState();
let history = [];

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return isValidState(parsed) ? parsed : createInitialState();
  } catch {
    return createInitialState();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function print(message, type = 'system') {
  const line = document.createElement('p');
  line.className = `line line-${type}`;
  line.textContent = message;
  output.append(line);
  output.scrollTop = output.scrollHeight;
}

function renderStatus() {
  const status = getStatus(state);
  chips.location.textContent = status.location;
  chips.health.textContent = `Health ${status.health}/5`;
  chips.stamina.textContent = `Stamina ${status.stamina}/5`;
  chips.turns.textContent = `Turns ${status.turns}`;
  discoveredList.innerHTML = '';
  status.discovered.forEach((place) => {
    const item = document.createElement('li');
    item.textContent = place;
    discoveredList.append(item);
  });
  undoButton.disabled = history.length === 0;
  document.body.dataset.won = status.won ? 'true' : 'false';
}

function run(command, echo = true) {
  const trimmed = command.trim();
  if (!trimmed) return;
  if (echo) print(`> ${trimmed}`, 'command');
  const result = executeCommand(state, trimmed);
  if (result.changed) history.push(state);
  state = result.state;
  if (result.changed) persist();
  print(result.output, result.tone === 'win' ? 'win' : result.tone === 'warning' ? 'warning' : 'system');
  renderStatus();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const command = input.value;
  input.value = '';
  run(command);
  input.focus();
});

quick.addEventListener('click', (event) => {
  const button = event.target.closest('[data-command]');
  if (button) run(button.dataset.command);
});

undoButton.addEventListener('click', () => {
  const previous = history.pop();
  if (!previous) return;
  state = previous;
  persist();
  print('> undo', 'command');
  print('The last state-changing action was undone.', 'good');
  renderStatus();
});

resetButton.addEventListener('click', () => {
  const confirmed = window.confirm('Start a fresh game? Your current local save will be replaced.');
  if (!confirmed) return;
  state = createInitialState();
  history = [];
  persist();
  output.innerHTML = '';
  print('Fresh game started.', 'good');
  print(describeLocation(state));
  renderStatus();
  input.focus();
});

print('TEXTGAME // Signal at Black Ridge', 'title');
print('Goal: restore the emergency beacon. Type “help” or tap a quick command. Progress saves automatically on this device.');
print(describeLocation(state));
renderStatus();
input.focus();

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
