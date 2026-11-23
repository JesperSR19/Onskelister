import { products } from './products.js';
import { firebaseConfig, wishlistId } from './firebase-config.js';

// Hjelpefunksjoner
const $ = id => document.getElementById(id);

const state = {
    category: 'Alle',
    sort: 'priority',
    favoritesOnly: false,
    reservations: {},
    db: null,
    auth: null,
    user: null,
    ready: false
};

const configured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

const money = n =>
    n === 0
        ? 'Valgfritt beløp'
        : new Intl.NumberFormat('nb-NO', {
            style: 'currency',
            currency: 'NOK',
            maximumFractionDigits: 0
        }).format(n);

const escapeHtml = s =>
    String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));

const toast = message => {
    const el = $('toast');

    el.textContent = message;
    el.classList.add('show');

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        el.classList.remove('show');
    }, 3200);
};

const favorites = () => {
    try {
        return JSON.parse(
            localStorage.getItem('wishlist-favorites') || '[]'
        );
    } catch {
        return [];
    }
};

const setFavorites = a => {
    localStorage.setItem(
        'wishlist-favorites',
        JSON.stringify(a)
    );
};


// Kategorier og filtre
function filters() {
    const categories = [
        'Alle',
        ...new Set(products.map(p => p.category))
    ];

    $('filters').innerHTML = categories.map(c => `
        <button
            class="filter ${state.category === c ? 'active' : ''}"
            data-cat="${escapeHtml(c)}"
        >
            ${escapeHtml(c)}
        </button>
    `).join('') + `
        <button
            class="filter ${state.favoritesOnly ? 'active' : ''}"
            data-fav="1"
        >
            ♡ Favoritter
        </button>
    `;
}


// Vise produktene
function render() {
    filters();

    let list = products.filter(p =>
        (state.category === 'Alle' || p.category === state.category) &&
        (!state.favoritesOnly || favorites().includes(p.id))
    );

    list.sort((a, b) =>
        state.sort === 'priceAsc'
            ? a.price - b.price
            : state.sort === 'priceDesc'
                ? b.price - a.price
                : state.sort === 'name'
                    ? a.name.localeCompare(b.name, 'no')
                    : a.priority - b.priority
    );

    $('totalCount').textContent = `(${products.length})`;
    $('empty').hidden = list.length > 0;


    // Informasjon om TCGjakt
    let tcgInfo = document.getElementById('tcgInfo');

    if (!tcgInfo) {
        tcgInfo = document.createElement('div');
        tcgInfo.id = 'tcgInfo';
        tcgInfo.className = 'tcg-info';

        $('productGrid').before(tcgInfo);
    }

    tcgInfo.hidden = state.category !== 'Pokémon TCG';

    tcgInfo.innerHTML = `
        <strong>Om TCGjakt</strong>
        <p>
            Pokémon-produktene lenker til TCGjakt, hvor du kan
            sammenligne priser fra ulike butikker. Du står fritt
            til å kjøpe produktene fra hvilken som helst pålitelig
            butikk. Sjekk pris og lagerstatus før bestilling.
        </p>
    `;


    // Produktkort
    $('productGrid').innerHTML = list.map(p => {
        const fav = favorites().includes(p.id);
        const reserved = Boolean(state.reservations[p.id]);
        const purchased = p.purchased === true;

        return `
            <article class="product">
                <div class="product-image ${purchased ? 'purchased' : ''}">
                    <img
                        src="${escapeHtml(p.image)}"
                        alt="${escapeHtml(p.name)}"
                        loading="lazy"
                        onerror="this.style.opacity='.15'"
                    >

                    ${purchased
                ? '<div class="purchased-banner">✓ KJØPT</div>'
                : ''
            }

                    <span class="pill ${p.priority === 1 ? 'fav' : ''}">
                        ${purchased
                ? '✓ Kjøpt'
                : p.priority === 1
                    ? '✦ Mest ønsket'
                    : reserved
                        ? '✓ Reservert'
                        : '✧ Ønske'
            }
                    </span>

                    <button
                        class="heart"
                        data-heart="${escapeHtml(p.id)}"
                        aria-label="${fav ? 'Fjern fra' : 'Legg til'} favoritter"
                        aria-pressed="${fav}"
                    >
                        ${fav ? '♥' : '♡'}
                    </button>
                </div>

                <div class="product-body">
                    <div class="category">
                        ${escapeHtml(p.category)}
                    </div>

                    <h3>${escapeHtml(p.name)}</h3>

                    <p class="description">
                        ${escapeHtml(p.description)}
                    </p>

                    <div class="price">
                        ${p.category === 'Pokémon TCG'
                        ? 'Se priser på TCGjakt'
                        : money(p.price)
                        }
                    </div>

                    <div class="actions">
                        <a
                            class="shop"
                            href="${escapeHtml(p.url)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            ${p.category === 'Pokémon TCG'
                ? 'Finn på TCGjakt ↗'
                : 'Se i butikk ↗'
            }
                        </a>

                        <button
                            class="reserve"
                            data-reserve="${escapeHtml(p.id)}"
                            ${reserved || purchased ? 'disabled' : ''}
                        >
                            ${purchased
                ? '✓ Allerede kjøpt'
                : reserved
                    ? '✓ Reservert'
                    : 'Reserver gave'
            }
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}


// Filtrering etter kategori og favoritter
$('filters').addEventListener('click', e => {
    const b = e.target.closest('button');

    if (!b) {
        return;
    }

    if (b.dataset.cat !== undefined) {
        state.category = b.dataset.cat;
    } else if (b.dataset.fav) {
        state.favoritesOnly = !state.favoritesOnly;
    }

    render();
});


// Sortering
$('sort').addEventListener('change', e => {
    state.sort = e.target.value;
    render();
});


// Valgt produkt for reservasjon
let selected = null;


// Klikk på favoritter eller reservasjon
$('productGrid').addEventListener('click', e => {
    const heart = e.target.closest('[data-heart]');

    if (heart) {
        const id = heart.dataset.heart;
        const s = new Set(favorites());

        if (s.has(id)) {
            s.delete(id);
        } else {
            s.add(id);
        }

        setFavorites([...s]);
        render();

        return;
    }

    const reserve = e.target.closest('[data-reserve]');

    if (reserve) {
        selected = products.find(
            p => p.id === reserve.dataset.reserve
        );

        if (!selected) {
            return;
        }

        if (!state.ready) {
            toast(
                'Reservasjoner aktiveres når Firebase er konfigurert.'
            );
            return;
        }

        $('dialogProduct').textContent = selected.name;
        $('reserveError').textContent = '';
        $('reserveDialog').showModal();
    }
});


// Del ønskelisten
async function share() {
    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Min ønskeliste',
                url: location.href
            });

            return;
        }

        await navigator.clipboard.writeText(location.href);

        toast('Lenken er kopiert!');
    } catch {
        toast('Kopier nettadressen fra adressefeltet.');
    }
}

$('shareBtn').addEventListener('click', share);
$('shareHero').addEventListener('click', share);


// Bekreft reservasjon
$('confirmReserve').addEventListener('click', async () => {
    if (!selected || !state.ready) {
        return;
    }

    const btn = $('confirmReserve');

    btn.disabled = true;
    btn.textContent = 'Reserverer …';

    $('reserveError').textContent = '';

    try {
        const {
            doc,
            runTransaction,
            serverTimestamp
        } = await import(
            'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'
        );

        const ref = doc(
            state.db,
            'wishlists',
            wishlistId,
            'reservations',
            selected.id
        );

        const name = $('reserverName').value.trim();

        await runTransaction(state.db, async transaction => {
            const snap = await transaction.get(ref);

            if (snap.exists()) {
                throw Error(
                    'Denne gaven er allerede reservert.'
                );
            }

            transaction.set(ref, {
                reserved: true,
                reservedBy: name || 'Anonym',
                createdAt: serverTimestamp(),
                ownerUid: state.user.uid
            });
        });

        $('reserveDialog').close();
        $('reserverName').value = '';

        toast('Gaven er reservert! Takk ♡');
    } catch (err) {
        $('reserveError').textContent =
            err.message || 'Kunne ikke reservere. Prøv igjen.';
    } finally {
        btn.disabled = false;
        btn.textContent = 'Bekreft reservasjon';
    }
});


// Firebase-oppsett
async function initFirebase() {
    if (!configured) {
        return;
    }

    try {
        const [
            { initializeApp },
            { getAuth, signInAnonymously },
            { getFirestore, collection, onSnapshot }
        ] = await Promise.all([
            import(
                'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'
            ),
            import(
                'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'
            ),
            import(
                'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'
            )
        ]);

        const app = initializeApp(firebaseConfig);

        state.auth = getAuth(app);
        state.db = getFirestore(app);

        const credential = await signInAnonymously(state.auth);

        state.user = credential.user;

        onSnapshot(
            collection(
                state.db,
                'wishlists',
                wishlistId,
                'reservations'
            ),

            snapshot => {
                state.reservations = {};

                snapshot.forEach(doc => {
                    state.reservations[doc.id] = true;
                });

                state.ready = true;
                render();
            },

            err => {
                console.error(err);
                state.ready = false;

                toast(
                    'Kunne ikke hente reservasjoner. Sjekk Firebase-reglene.'
                );
            }
        );
    } catch (err) {
        console.error(err);

        toast(
            'Reservasjoner er utilgjengelige. Sjekk Firebase-oppsettet.'
        );
    }
}


// Start nettsiden
render();
initFirebase();