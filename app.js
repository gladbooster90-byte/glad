const games = [
  { title: "Heads & Bells", tags: ["Popular", "Slots", "Spin & Win"] },
  { title: "Luxury Life", tags: ["Popular", "Slots", "New"] },
  { title: "10 Boost Clover", tags: ["Popular", "Slots", "Hot", "Spin & Win"] },
  { title: "10 Boost Hot", tags: ["Popular", "Slots", "Hot", "Crash"] },
  { title: "10 Billy Fruits", tags: ["Slots", "Hot", "New"] },
  { title: "10 Clover Deluxe", tags: ["Popular", "Slots", "Hot"] },
  { title: "10 Clover Fire", tags: ["Popular", "Slots", "Hot"] },
  { title: "10 Crown Deluxe", tags: ["Slots", "New"] },
  { title: "10 Extra Bank", tags: ["Popular", "Slots", "Spin & Win"] },
  { title: "10 Fire Fruits", tags: ["Slots", "Hot"] },
  { title: "10 Heart Deluxe", tags: ["Popular", "Slots"] },
  { title: "10 Hot Wild Deluxe", tags: ["Slots", "Hot", "New"] },
  { title: "Jingle Bells", tags: ["Slots", "New"] },
  { title: "10 Sparkling Crown", tags: ["Popular", "Slots", "Spin & Win"] },
  { title: "10 Sparkling Crown 2", tags: ["Slots", "Hot", "Spin & Win"] },
  { title: "10 Tropical Fruits", tags: ["Popular", "Slots"] },
  { title: "10 Wild Crown", tags: ["Slots", "Hot"] },
  { title: "10 Wild Crown Deluxe", tags: ["Slots", "New"] },
  { title: "10 Wild Diamond", tags: ["Popular", "Slots", "Wheel"] },
  { title: "10 Wild Dice", tags: ["Slots", "Hot", "Wheel", "Spinners"] },
  { title: "10 Wild Heart", tags: ["Slots", "New"] },
  { title: "10 Wild Pumpkin", tags: ["Slots", "Hot"] },
  { title: "10 Wild Santa", tags: ["Slots", "New"] },
  { title: "100 Blazing Clover", tags: ["Popular", "Slots", "Spin & Win"] },
  { title: "100 Bracelets", tags: ["Slots", "New"] },
  { title: "100 Clover Fire", tags: ["Popular", "Slots", "Hot"] },
  { title: "100 Ducks Hot", tags: ["Slots", "Hot"] },
  { title: "100 Gold Coins", tags: ["Popular", "Slots", "Split The Pot"] },
  { title: "100 Hold & Win", tags: ["Slots", "New", "Split The Pot"] },
  { title: "100 Zombies", tags: ["Slots", "Popular", "Crash"] },
  { title: "12 Bells", tags: ["Slots", "New", "Spin & Win"] },
  { title: "12 Coins", tags: ["Slots", "Popular", "Split The Pot"] },
  { title: "12 Coins Diamond", tags: ["Slots", "Hot", "Split The Pot"] },
  { title: "12 Coins Gold", tags: ["Slots", "New", "Split The Pot"] },
  { title: "15 Coins Platinum", tags: ["Slots", "Popular", "Wheel"] },
  { title: "15 Coins Xmas", tags: ["Slots", "New"] },
];

const STORAGE_KEY = "lucky-lounge-demo-v1";
const STARTING_BALANCE = 1000;
const symbols = ["🍀", "💎", "🔔", "🍒", "7️⃣", "⭐"];
const grid = document.querySelector("#gamesGrid");
const emptyState = document.querySelector("#emptyState");
const categoryBar = document.querySelector("#categoryBar");
const categoryButtons = [...document.querySelectorAll(".category-chip")];
const searchInput = document.querySelector("#gameSearch");
const loadMoreButton = document.querySelector("#loadMore");
const toast = document.querySelector("#toast");
const gameModal = document.querySelector("#gameModal");
const menuModal = document.querySelector("#menuModal");
let selectedCategory = "All";
let displayLimit = 24;
let alphabetical = false;
let currentView = "lobby";
let currentGameIndex = 0;
let stake = 10;
let toastTimeout;

function loadSavedState() {
  const defaults = { balance: STARTING_BALANCE, name: "Guest", favorites: [], history: [], spins: 0, dailyBonusDate: "" };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return defaults;
    return {
      ...defaults,
      ...saved,
      balance: Number.isFinite(Number(saved.balance)) ? Math.max(0, Number(saved.balance)) : STARTING_BALANCE,
      name: typeof saved.name === "string" ? saved.name.slice(0, 24) : "Guest",
      favorites: Array.isArray(saved.favorites) ? saved.favorites.filter((index) => Number.isInteger(index) && index >= 0 && index < games.length) : [],
      history: Array.isArray(saved.history) ? saved.history.filter((entry) => entry && typeof entry === "object").slice(0, 50) : [],
      spins: Number.isFinite(Number(saved.spins)) ? Math.max(0, Number(saved.spins)) : 0,
      dailyBonusDate: typeof saved.dailyBonusDate === "string" ? saved.dailyBonusDate : "",
    };
  } catch {
    return defaults;
  }
}

let player = loadSavedState();

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
  } catch {
    showToast("Browser storage is unavailable; changes will not persist after closing this page.");
  }
}

function formatCoins(value) {
  const amount = Number(value);
  return (Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0).toLocaleString();
}

function updatePlayerUI() {
  document.querySelector("#headerBalance").textContent = formatCoins(player.balance);
  document.querySelector("#playerBalance").textContent = formatCoins(player.balance);
  document.querySelector("#walletBalance").textContent = formatCoins(player.balance);
  document.querySelector("#profileNameLabel").textContent = player.name || "Guest";
  document.querySelector("#profileNameInput").value = player.name === "Guest" ? "" : player.name;
  document.querySelector("#spinsPlayed").textContent = formatCoins(player.spins);
  updateBonusUI();
  updateSpinButton();
}

function dateKey() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function updateBonusUI() {
  const claimed = player.dailyBonusDate === dateKey();
  const button = document.querySelector("#dailyBonusButton");
  button.disabled = claimed;
  button.textContent = claimed ? "Collected today" : "Collect 100 coins";
  document.querySelector("#dailyBonusStatus").textContent = claimed ? "Your daily demo bonus is already collected." : "Available once each day in this browser.";
}

function gamesForView() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  let results = games.map((game, index) => ({
    ...game,
    index,
    image: `assets/game-${String(index + 1).padStart(2, "0")}.jpg`,
  }));

  if (currentView === "favorites") results = results.filter((game) => player.favorites.includes(game.index));
  else if (selectedCategory !== "All") results = results.filter((game) => game.tags.includes(selectedCategory));
  if (query) results = results.filter((game) => game.title.toLocaleLowerCase().includes(query));
  return alphabetical ? results.sort((a, b) => a.title.localeCompare(b.title)) : results;
}

function renderGames() {
  const results = gamesForView();
  const visible = results.slice(0, displayLimit);
  grid.replaceChildren();

  for (const game of visible) {
    const favorite = player.favorites.includes(game.index);
    const card = document.createElement("article");
    card.className = "game-card";
    card.innerHTML = `
      <button class="game-art-button" type="button" aria-label="Play ${game.title}" data-play="${game.index}">
        <img src="${game.image}" alt="${game.title} game artwork" loading="lazy" />
      </button>
      <button class="favorite-button${favorite ? " is-favorite" : ""}" type="button" aria-label="${favorite ? "Remove" : "Add"} ${game.title} ${favorite ? "from" : "to"} favorites" aria-pressed="${favorite}" data-favorite="${game.index}">${favorite ? "♥" : "♡"}</button>
      <div class="game-overlay"><span class="game-title">${game.title}</span><span class="play-label">Play demo</span></div>`;
    grid.append(card);
  }

  const isEmpty = results.length === 0;
  emptyState.hidden = !isEmpty;
  grid.hidden = isEmpty;
  loadMoreButton.parentElement.hidden = isEmpty || results.length <= displayLimit;
  document.querySelector("#headingLabel").textContent = currentView === "favorites"
    ? "Favorite games"
    : selectedCategory === "All" ? "All games" : selectedCategory;
  if (currentView === "favorites") {
    emptyState.querySelector("h2").textContent = "No favorites yet";
    emptyState.querySelector("p").textContent = "Tap the heart on a game tile to save it here.";
    document.querySelector("#resetFilters").textContent = "Browse games";
  } else {
    emptyState.querySelector("h2").textContent = "No games found";
    emptyState.querySelector("p").textContent = "Try another title or choose a different category.";
    document.querySelector("#resetFilters").textContent = "Show all games";
  }
}

function renderHistory() {
  const list = document.querySelector("#historyList");
  const empty = document.querySelector("#historyEmpty");
  list.replaceChildren();
  const entries = [...player.history].reverse();
  empty.hidden = entries.length > 0;
  document.querySelector("#clearHistoryButton").hidden = entries.length === 0;
  for (const entry of entries) {
    const row = document.createElement("article");
    row.className = "history-entry";
    const amount = Number(entry.net) || 0;
    const date = new Date(entry.time);
    const gameIndex = games.findIndex((game) => game.title === entry.title);
    const image = document.createElement("img");
    image.src = `assets/game-${String(gameIndex < 0 ? 1 : gameIndex + 1).padStart(2, "0")}.jpg`;
    image.alt = "";
    image.loading = "lazy";
    const details = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = typeof entry.title === "string" ? entry.title : "Casino game";
    const meta = document.createElement("small");
    meta.textContent = `${Number.isNaN(date.getTime()) ? "Recent" : date.toLocaleString()} · Stake ${formatCoins(entry.stake)} coins`;
    details.append(title, meta);
    const payout = document.createElement("span");
    payout.className = `history-payout${amount < 0 ? " loss" : ""}`;
    payout.textContent = `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatCoins(Math.abs(amount))} net`;
    row.append(image, details, payout);
    list.append(row);
  }
}

function setView(view) {
  currentView = view;
  document.querySelectorAll(".primary-nav [data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const showLobby = view === "lobby" || view === "favorites";
  document.querySelector("#lobbyView").hidden = !showLobby;
  document.querySelector("#historyView").hidden = view !== "history";
  document.querySelector("#rewardsView").hidden = view !== "rewards";
  categoryBar.hidden = view !== "lobby";
  if (view === "favorites") {
    selectedCategory = "All";
    categoryButtons.forEach((button) => button.classList.toggle("active", button.textContent.trim() === "Home"));
  }
  if (view === "history") renderHistory();
  renderGames();
  if (menuModal.open) menuModal.close();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("visible"), 2700);
}

function updateSpinButton() {
  const button = document.querySelector("#spinButton");
  button.textContent = `Spin for ${stake} coins`;
  button.disabled = player.balance < stake;
  if (player.balance < stake) button.textContent = "Not enough demo coins";
}

function openGame(index) {
  currentGameIndex = index;
  const game = games[index];
  document.querySelector("#modalGameImage").src = `assets/game-${String(index + 1).padStart(2, "0")}.jpg`;
  document.querySelector("#modalGameImage").alt = `${game.title} game artwork`;
  document.querySelector("#modalGameTitle").textContent = game.title;
  document.querySelector("#spinResult").textContent = "Choose a stake and spin for fun.";
  document.querySelector("#spinResult").className = "spin-result";
  document.querySelector("#reelOne").textContent = "🍀";
  document.querySelector("#reelTwo").textContent = "💎";
  document.querySelector("#reelThree").textContent = "🔔";
  updatePlayerUI();
  gameModal.showModal();
}

function playSpin() {
  if (player.balance < stake) {
    showToast("You need more demo coins to spin.");
    return;
  }

  const spinButton = document.querySelector("#spinButton");
  const reels = [document.querySelector("#reelOne"), document.querySelector("#reelTwo"), document.querySelector("#reelThree")];
  const result = document.querySelector("#spinResult");
  const startingStake = stake;
  player.balance -= startingStake;
  updatePlayerUI();
  spinButton.disabled = true;
  result.textContent = "Spinning…";
  result.className = "spin-result";
  reels.forEach((reel) => reel.classList.add("spinning"));

  setTimeout(() => {
    const outcome = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    reels.forEach((reel, index) => {
      reel.textContent = outcome[index];
      reel.classList.remove("spinning");
    });

    let payout = 0;
    if (outcome[0] === "7️⃣" && outcome.every((symbol) => symbol === outcome[0])) payout = startingStake * 20;
    else if (outcome.every((symbol) => symbol === outcome[0])) payout = startingStake * 10;
    else if (outcome[0] === outcome[1] || outcome[1] === outcome[2] || outcome[0] === outcome[2]) payout = startingStake * 2;

    player.balance += payout;
    player.spins += 1;
    const net = payout - startingStake;
    const game = games[currentGameIndex];
    player.history.push({
      title: game.title,
      image: `assets/game-${String(currentGameIndex + 1).padStart(2, "0")}.jpg`,
      stake: startingStake,
      net,
      time: new Date().toISOString(),
    });
    player.history = player.history.slice(-50);
    saveState();
    updatePlayerUI();
    if (payout > 0) {
      result.textContent = `${outcome.every((symbol) => symbol === outcome[0]) ? "Match!" : "Pair!"} You won ${formatCoins(payout)} coins.`;
      result.className = "spin-result win";
    } else {
      result.textContent = "No win this time. Your next spin is ready.";
      result.className = "spin-result loss";
    }
    spinButton.disabled = player.balance < stake;
    renderHistory();
    if (currentView === "rewards") document.querySelector("#spinsPlayed").textContent = formatCoins(player.spins);
  }, 520);
}

function toggleFavorite(index, button) {
  const exists = player.favorites.includes(index);
  player.favorites = exists ? player.favorites.filter((favorite) => favorite !== index) : [...player.favorites, index];
  saveState();
  if (button) {
    button.classList.toggle("is-favorite", !exists);
    button.textContent = exists ? "♡" : "♥";
    button.setAttribute("aria-pressed", String(!exists));
    button.setAttribute("aria-label", `${exists ? "Add" : "Remove"} ${games[index].title} ${exists ? "to" : "from"} favorites`);
  }
  if (currentView === "favorites" && exists) renderGames();
  showToast(exists ? "Removed from favorites" : "Added to favorites");
}

categoryButtons.forEach((button) => button.addEventListener("click", () => {
  categoryButtons.forEach((chip) => chip.classList.remove("active"));
  button.classList.add("active");
  selectedCategory = button.dataset.category;
  displayLimit = 24;
  renderGames();
}));

searchInput.addEventListener("input", () => {
  displayLimit = 24;
  renderGames();
});

document.querySelector("#topSearchButton").addEventListener("click", () => {
  setView("lobby");
  searchInput.focus();
  categoryBar.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

document.querySelector("#sortButton").addEventListener("click", (event) => {
  alphabetical = !alphabetical;
  event.currentTarget.querySelector("span").textContent = alphabetical ? "Featured" : "A–Z";
  event.currentTarget.setAttribute("aria-label", alphabetical ? "Sort games by featured order" : "Sort games alphabetically");
  renderGames();
});

loadMoreButton.addEventListener("click", () => {
  displayLimit += 12;
  renderGames();
});

document.querySelector("#resetFilters").addEventListener("click", () => {
  if (currentView === "favorites") {
    searchInput.value = "";
    setView("lobby");
    return;
  }
  searchInput.value = "";
  selectedCategory = "All";
  categoryButtons.forEach((button) => button.classList.toggle("active", button.textContent.trim() === "All"));
  renderGames();
});

grid.addEventListener("click", (event) => {
  const playButton = event.target.closest("[data-play]");
  if (playButton) {
    openGame(Number(playButton.dataset.play));
    return;
  }
  const favoriteButton = event.target.closest("[data-favorite]");
  if (favoriteButton) toggleFavorite(Number(favoriteButton.dataset.favorite), favoriteButton);
});

document.querySelector("#spinButton").addEventListener("click", playSpin);
document.querySelector("#stakeDown").addEventListener("click", () => {
  stake = Math.max(10, stake - 10);
  document.querySelector("#stakeValue").textContent = stake;
  updateSpinButton();
});
document.querySelector("#stakeUp").addEventListener("click", () => {
  stake = Math.min(100, stake + 10);
  document.querySelector("#stakeValue").textContent = stake;
  updateSpinButton();
});

document.querySelector("#walletButton").addEventListener("click", () => document.querySelector("#walletModal").showModal());
document.querySelector("#menuWalletButton").addEventListener("click", () => {
  if (menuModal.open) menuModal.close();
  document.querySelector("#walletModal").showModal();
});
document.querySelector("#claimWalletCoins").addEventListener("click", () => {
  player.balance += 250;
  saveState();
  updatePlayerUI();
  showToast("250 free demo coins added");
});

document.querySelector("#profileButton").addEventListener("click", () => {
  document.querySelector("#profileNameInput").value = player.name === "Guest" ? "" : player.name;
  document.querySelector("#profileModal").showModal();
});
document.querySelector("#saveProfileButton").addEventListener("click", () => {
  const name = document.querySelector("#profileNameInput").value.trim();
  if (!name) {
    showToast("Enter a display name to save your profile.");
    return;
  }
  player.name = name.slice(0, 24);
  saveState();
  updatePlayerUI();
  document.querySelector("#profileModal").close();
  showToast(`Welcome, ${player.name}`);
});

document.querySelector("#dailyBonusButton").addEventListener("click", () => {
  if (player.dailyBonusDate === dateKey()) return;
  player.dailyBonusDate = dateKey();
  player.balance += 100;
  saveState();
  updatePlayerUI();
  showToast("100 daily demo coins collected");
});

document.querySelector("#clearHistoryButton").addEventListener("click", () => {
  player.history = [];
  saveState();
  renderHistory();
  showToast("Play history cleared");
});

document.querySelector("#resetDataButton").addEventListener("click", () => {
  if (!window.confirm("Reset your local demo profile, coins, favorites, and play history?")) return;
  player = { balance: STARTING_BALANCE, name: "Guest", favorites: [], history: [], spins: 0, dailyBonusDate: "" };
  saveState();
  updatePlayerUI();
  renderGames();
  renderHistory();
  showToast("Demo data reset");
});

document.querySelectorAll(".primary-nav [data-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
document.querySelectorAll("[data-go-view]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.goView)));
document.querySelector("#menuButton").addEventListener("click", () => menuModal.showModal());
document.querySelector("#menuProfileButton").addEventListener("click", () => {
  if (menuModal.open) menuModal.close();
  document.querySelector("#profileModal").showModal();
});
document.querySelectorAll(".modal-close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
}));
document.querySelector("#backToTop").addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
window.addEventListener("scroll", () => document.querySelector("#backToTop").classList.toggle("visible", window.scrollY > 650), { passive: true });

updatePlayerUI();
renderGames();
renderHistory();
