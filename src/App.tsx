import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bike,
  CheckCircle,
  ChefHat,
  ChevronRight,
  Clock,
  CreditCard,
  Flame,
  Heart,
  Instagram,
  Leaf,
  Minus,
  Phone,
  Plus,
  Save,
  ShoppingCart,
  User,
} from "lucide-react";

const C = {
  bg: "#0d0d0d",
  bgCard: "#181818",
  bgCard2: "#212121",
  orange: "#ff8c00",
  white: "#ffffff",
  gray: "#888",
  grayLight: "#bbb",
  border: "#2a2a2a",
  red: "#e74c3c",
};

type Category = "tradicionais" | "classicas" | "doces" | "bebidas";
type Page = "home" | "menu" | "product" | "cart" | "checkout";
type Payment = "pix" | "dinheiro" | "credito" | "debito";

type MenuItem = {
  id: number;
  name: string;
  desc: string;
  emoji: string;
  image: string;
  cat: Category;
  grande?: number;
  broto?: number;
  preco?: number;
};

type CartItem = {
  key: string;
  id: number;
  name: string;
  price: number;
  qty: number;
  size: "grande" | "broto" | "unico";
  emoji: string;
  image: string;
};

type UserData = {
  nome: string;
  sobrenome: string;
  telefone: string;
  endereco: string;
  pagamento: Payment;
  troco: boolean;
  trocoValor: string;
};

const tradicionais: MenuItem[] = [
  { id: 1, name: "Calabresa", desc: "Molho de tomate, fatias de calabresa, cebola, orégano e azeitona.", grande: 55, broto: 35, emoji: "🍕", image: "/menu/calabresa.png", cat: "tradicionais" },
  { id: 2, name: "Muçarela", desc: "Molho de tomate, muçarela, tomate fresco, orégano e azeitona.", grande: 55, broto: 35, emoji: "🧀", image: "/menu/mucarela.png", cat: "tradicionais" },
  { id: 3, name: "Frango c/ Catupiry", desc: "Molho de tomate, frango desfiado, milho, catupiry cremoso, orégano e azeitona.", grande: 55, broto: 35, emoji: "🍗", image: "/menu/frango-catupiry.png", cat: "tradicionais" },
  { id: 4, name: "Frango c/ Bacon", desc: "Molho de tomate, frango desfiado, catupiry cremoso, muçarela, bacon crocante, orégano e azeitona.", grande: 55, broto: 35, emoji: "🥓", image: "/menu/frango-bacon.png", cat: "tradicionais" },
  { id: 5, name: "Milho", desc: "Molho de tomate, milho, catupiry cremoso, muçarela, orégano e azeitona.", grande: 55, broto: 35, emoji: "🌽", image: "/menu/milho.png", cat: "tradicionais" },
  { id: 6, name: "Palmito", desc: "Molho de tomate, palmito selecionado, muçarela, orégano e azeitona.", grande: 55, broto: 35, emoji: "🌿", image: "/menu/palmito.png", cat: "tradicionais" },
  { id: 7, name: "Bauru", desc: "Molho de tomate, presunto, muçarela, tomate fresco, orégano e azeitona.", grande: 50, broto: 35, emoji: "🥩", image: "/menu/bauru.png", cat: "tradicionais" },
  { id: 8, name: "Lombo", desc: "Molho de tomate, lombo fatiado, muçarela, orégano e azeitona.", grande: 50, broto: 35, emoji: "🍖", image: "/menu/lombo.png", cat: "tradicionais" },
  { id: 9, name: "Toscana", desc: "Molho de tomate, calabresa, cebola, muçarela, orégano e azeitona.", grande: 55, broto: 35, emoji: "🌶️", image: "/menu/toscana.png", cat: "tradicionais" },
  { id: 10, name: "Pizzaiolo", desc: "Molho de tomate, calabresa, tomate, muçarela, alho frito, orégano e azeitona.", grande: 55, broto: 35, emoji: "👨‍🍳", image: "/menu/pizzaiolo.png", cat: "tradicionais" },
  { id: 11, name: "Baiana", desc: "Molho de tomate, calabresa, pimenta, cebola, pimentão, muçarela, orégano e azeitona.", grande: 55, broto: 35, emoji: "🌶️", image: "/menu/baiana.png", cat: "tradicionais" },
  { id: 12, name: "Brócolis", desc: "Molho de tomate, brócolis, tomate, muçarela, bacon, orégano e azeitona.", grande: 55, broto: 35, emoji: "🥦", image: "/menu/brocolis.png", cat: "tradicionais" },
];

const classicas: MenuItem[] = [
  { id: 13, name: "4 Queijos", desc: "Molho de tomate, catupiry cremoso, muçarela, parmesão, provolone, orégano e azeitona.", grande: 60, broto: 37, emoji: "🧀", image: "/menu/quatro-queijos.png", cat: "classicas" },
  { id: 14, name: "5 Queijos", desc: "Molho de tomate, catupiry cremoso, cheddar, muçarela, parmesão, provolone, orégano e azeitona.", grande: 65, broto: 42, emoji: "🧀", image: "/menu/cinco-queijos.png", cat: "classicas" },
  { id: 15, name: "Portuguesa", desc: "Molho de tomate, presunto, cebola, ervilha, ovo, palmito, muçarela, orégano e azeitona.", grande: 65, broto: 42, emoji: "🥚", image: "/menu/portuguesa.png", cat: "classicas" },
  { id: 16, name: "Du Cheff", desc: "Molho de tomate, frango desfiado, milho, palmito, tomate, catupiry cremoso, tomate seco, orégano e azeitona.", grande: 60, broto: 40, emoji: "⭐", image: "/menu/du-cheff.png", cat: "classicas" },
  { id: 17, name: "Carne Strogonoff", desc: "Molho de tomate, muçarela, carne, champignon, batata palha, orégano e azeitona.", grande: 70, broto: 42, emoji: "🥩", image: "/menu/carne-strogonoff.png", cat: "classicas" },
  { id: 18, name: "Frango Strogonoff", desc: "Molho de tomate, muçarela, frango, champignon, batata palha, orégano e azeitona.", grande: 70, broto: 42, emoji: "🍗", image: "/menu/frango-strogonoff.png", cat: "classicas" },
  { id: 19, name: "Carne Seca", desc: "Molho de tomate, carne seca desfiada, cebola, catupiry cremoso, tomate, muçarela, orégano e azeitona.", grande: 75, broto: 45, emoji: "🥩", image: "/menu/carne-seca.png", cat: "classicas" },
  { id: 20, name: "Especial da Casa", desc: "Molho de tomate, presunto, cebola, ervilha, milho, ovo, frango desfiado, muçarela, bacon, orégano e azeitona.", grande: 65, broto: 40, emoji: "🏆", image: "/menu/especial-da-casa.png", cat: "classicas" },
  { id: 21, name: "Nordestina", desc: "Molho de tomate, muçarela, carne seca desfiada, cebola, queijo coalho, mel, orégano e azeitona.", grande: 75, broto: 45, emoji: "🤠", image: "/menu/nordestina.png", cat: "classicas" },
  { id: 22, name: "Atum", desc: "Molho de tomate, atum, cebola, muçarela, orégano e azeitona.", grande: 60, broto: 40, emoji: "🐟", image: "/menu/atum.png", cat: "classicas" },
];

const doces: MenuItem[] = [
  { id: 23, name: "Mesclada", desc: "Chocolate ao leite e chocolate branco.", grande: 55, broto: 35, emoji: "🍫", image: "/menu/mesclada.png", cat: "doces" },
  { id: 24, name: "Confete", desc: "Chocolate ao leite, granulado e confete.", grande: 55, broto: 35, emoji: "🎉", image: "/menu/confete.png", cat: "doces" },
  { id: 25, name: "Bis", desc: "Chocolate ao leite, granulado e pedaços de Bis.", grande: 55, broto: 35, emoji: "🍫", image: "/menu/bis.png", cat: "doces" },
  { id: 26, name: "Banana Flambada", desc: "Banana e chocolate branco.", grande: 55, broto: 35, emoji: "🍌", image: "/menu/banana-flambada.png", cat: "doces" },
];

const bebidas: MenuItem[] = [
  { id: 27, name: "Coca-Cola 2L", desc: "Refrigerante gelado.", preco: 15, emoji: "🥤", image: "/menu/coca-2l.png", cat: "bebidas" },
  { id: 28, name: "Fanta 2L", desc: "Refrigerante gelado.", preco: 13, emoji: "🧃", image: "/menu/fanta-2l.png", cat: "bebidas" },
  { id: 29, name: "Conquista 2L", desc: "Refrigerante gelado.", preco: 7, emoji: "🥤", image: "/menu/conquista-2l.png", cat: "bebidas" },
  { id: 30, name: "Coca-Cola Lata", desc: "Refrigerante gelado.", preco: 5, emoji: "🥫", image: "/menu/coca-lata.png", cat: "bebidas" },
];

const ALL = [...tradicionais, ...classicas, ...doces, ...bebidas];
const DESTAQUES = [tradicionais[0], tradicionais[2], classicas[0], classicas[6]];
const STORAGE_KEY = "kaue_user_data";

const defaultUser: UserData = {
  nome: "",
  sobrenome: "",
  telefone: "",
  endereco: "",
  pagamento: "pix",
  troco: false,
  trocoValor: "",
};

const fmt = (n: number) => `R$ ${n.toFixed(2).replace(".", ",")}`;

const BG: Record<number | "default", string> = {
  default: "radial-gradient(circle at 60% 40%, #c0392b 0%, #8B1A1A 50%, #4a0a0a 100%)",
  2: "radial-gradient(circle, #f5c842 0%, #d4960c 50%, #795548 100%)",
  3: "radial-gradient(circle, #fff9c4 10%, #ff8f00 60%, #795548 100%)",
  4: "radial-gradient(circle, #d84315 20%, #4e342e 70%, #3e2723 100%)",
  5: "radial-gradient(circle, #fdd835 20%, #ff8f00 60%, #795548 100%)",
  6: "radial-gradient(circle, #81c784 20%, #388e3c 60%, #795548 100%)",
  13: "radial-gradient(circle, #fff9c4 10%, #f9a825 50%, #795548 100%)",
  19: "radial-gradient(circle, #a1887f 20%, #6d4c41 60%, #3e2723 100%)",
  23: "radial-gradient(circle, #f5f5f5 10%, #6d4c41 60%, #3e2723 100%)",
  24: "radial-gradient(circle, #ff4081 20%, #ff6d00 40%, #ffea00 60%, #00e676 80%)",
  27: "radial-gradient(circle, #ef5350 20%, #b71c1c 70%, #7f0000 100%)",
  28: "radial-gradient(circle, #ffa726 20%, #e65100 70%, #bf360c 100%)",
  29: "radial-gradient(circle, #5c6bc0 20%, #1a237e 70%, #0d1547 100%)",
};

const getPizzaBg = (id: number) => BG[id] || BG.default;

const readSavedUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultUser, ...JSON.parse(raw) } : defaultUser;
  } catch {
    return defaultUser;
  }
};

const saveUser = (data: UserData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export default function PizzariaKaue() {
  const [page, setPage] = useState<Page>("home");
  const [product, setProduct] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cat, setCat] = useState<Category | "todos">("todos");
  const [size, setSize] = useState<"grande" | "broto" | "unico">("grande");
  const [qty, setQty] = useState(1);
  const [userData, setUserData] = useState<UserData>(defaultUser);
  const [dataSaved, setDataSaved] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = readSavedUser();
    setUserData(saved);
    setDataSaved(Boolean(saved.nome || saved.telefone || saved.endereco));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [page]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const items = useMemo(() => {
    if (cat === "tradicionais") return tradicionais;
    if (cat === "classicas") return classicas;
    if (cat === "doces") return doces;
    if (cat === "bebidas") return bebidas;
    return ALL;
  }, [cat]);

  const openProduct = (item: MenuItem) => {
    setProduct(item);
    setSize(item.preco !== undefined ? "unico" : "grande");
    setQty(1);
    setPage("product");
  };

  const addToCart = () => {
    if (!product) return;
    const price = product.preco ?? (size === "grande" ? product.grande! : product.broto!);
    const label = product.preco !== undefined ? "" : ` (${size === "grande" ? "Grande" : "Broto"})`;
    const key = `${product.id}-${size}`;

    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      return [...prev, { key, id: product.id, name: product.name + label, price, qty, size, emoji: product.emoji, image: product.image }];
    });
    setPage("menu");
  };

  const updateQty = (key: string, delta: number) => {
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  };

  const finalizarPedido = (data: UserData) => {
    saveUser(data);
    setUserData(data);
    setDataSaved(true);

    const lines = cart.map((i) => `• ${i.name} x${i.qty} - ${fmt(i.price * i.qty)}`).join("\n");
    const pagLabels: Record<Payment, string> = { pix: "PIX", dinheiro: "Dinheiro", credito: "Cartão de Crédito", debito: "Cartão de Débito" };
    const trocoInfo = data.pagamento === "dinheiro" && data.troco ? `\nTroco para: R$ ${data.trocoValor}` : "";
    const msg = `🍕 *PEDIDO - PIZZARIA KAUE*

👤 *${data.nome} ${data.sobrenome}*
📱 ${data.telefone}
📍 ${data.endereco}

*ITENS DO PEDIDO:*
${lines}

💰 *Total: ${fmt(cartTotal)}*
💳 Pagamento: ${pagLabels[data.pagamento]}${trocoInfo}

Aguardo confirmação! 😊`;

    window.open(`https://wa.me/5514998111853?text=${encodeURIComponent(msg)}`, "_blank");
    setCart([]);
    setPage("home");
  };

  return (
    <div className="kaue-app">
      <style>{globalCss}</style>
      <div ref={scrollRef} className="kaue-scroll">
        {page === "home" && <HomePage go={setPage} openProduct={openProduct} cartCount={cartCount} dataSaved={dataSaved} />}
        {page === "menu" && <MenuPage go={setPage} items={items} cat={cat} setCat={setCat} cartCount={cartCount} openProduct={openProduct} />}
        {page === "product" && product && <ProductPage go={setPage} product={product} size={size} setSize={setSize} qty={qty} setQty={setQty} addToCart={addToCart} cartCount={cartCount} />}
        {page === "cart" && <CartPage go={setPage} cart={cart} total={cartTotal} updateQty={updateQty} />}
        {page === "checkout" && <CheckoutPage go={setPage} cart={cart} total={cartTotal} userData={userData} setUserData={setUserData} finalizarPedido={finalizarPedido} dataSaved={dataSaved} />}
      </div>
    </div>
  );
}

function HomePage({ go, openProduct, cartCount, dataSaved }: { go: (p: Page) => void; openProduct: (i: MenuItem) => void; cartCount: number; dataSaved: boolean }) {
  return (
    <>
      <TopHeader go={go} cartCount={cartCount} dataSaved={dataSaved} />
      <section className="hero">
        <button onClick={() => go("menu")} className="banner-only hero-banner" aria-label="Abrir cardápio">
          <img src="/menu/banner-text-forno.png" alt="Forno a lenha - Pizza artesanal no capricho" />
        </button>
      </section>
      <section className="features">
        {[
          [<Flame size={22} />, "Forno a Lenha"],
          [<Leaf size={22} />, "Ingredientes Selecionados"],
          [<ChefHat size={22} />, "Receitas Exclusivas"],
          [<Heart size={22} />, "Feita com Paixão"],
        ].map(([icon, label]) => <div key={String(label)}>{icon}<span>{label}</span></div>)}
      </section>
      <button onClick={() => go("menu")} className="banner-only special-banner" aria-label="Ver pizzas especiais">
        <img src="/menu/banner-text-especiais.png" alt="Nossas especiais - Escolha seu sabor favorito" />
      </button>
      <SectionTitle small="Mais Pedidos" title="Destaques 🔥" />
      <div className="grid">
        {DESTAQUES.map((item) => <ProductCard key={item.id} item={item} onClick={() => openProduct(item)} badge="Destaque 🔥" />)}
      </div>
      <BottomInfo />
      <Footer />
    </>
  );
}

function TopHeader({ go, cartCount, dataSaved }: { go: (p: Page) => void; cartCount: number; dataSaved?: boolean }) {
  return (
    <header className="top">
      <button className="brand" onClick={() => go("home")}>
        <span><img src="/pizzaria-kaue-logo.png" alt="" /></span>
        <strong>Kaue<small>FORNO A LENHA</small></strong>
      </button>
      <div className="top-actions">
        {dataSaved && <span className="saved"><CheckCircle size={12} /> Dados salvos</span>}
        <button className="delivery" onClick={() => go("menu")}><Bike size={14} /> DELIVERY</button>
        <CartButton go={go} cartCount={cartCount} />
      </div>
    </header>
  );
}

function CartButton({ go, cartCount }: { go: (p: Page) => void; cartCount: number }) {
  return (
    <button className="cart-icon" onClick={() => go("cart")}>
      <ShoppingCart size={22} />
      {cartCount > 0 && <span>{cartCount}</span>}
    </button>
  );
}

function MenuPage({ go, items, cat, setCat, cartCount, openProduct }: { go: (p: Page) => void; items: MenuItem[]; cat: Category | "todos"; setCat: (c: Category | "todos") => void; cartCount: number; openProduct: (i: MenuItem) => void }) {
  const cats: { key: Category | "todos"; label: string }[] = [
    { key: "todos", label: "Todos" },
    { key: "tradicionais", label: "Tradicionais" },
    { key: "classicas", label: "Clássicas" },
    { key: "doces", label: "Doces" },
    { key: "bebidas", label: "Bebidas" },
  ];

  return (
    <>
      <header className="menu-head">
        <div className="menu-row">
          <button className="brand compact" onClick={() => go("home")}><span><img src="/pizzaria-kaue-logo.png" alt="" /></span><strong>Pizzaria Kaue<small>Aberto agora</small></strong></button>
          <CartButton go={go} cartCount={cartCount} />
        </div>
        <div className="delivery-note"><Bike size={13} /> Entrega em até 1 hora · São Pedro do Turvo - SP</div>
        <div className="tabs">
          {cats.map((c) => <button key={c.key} onClick={() => setCat(c.key)} className={cat === c.key ? "active" : ""}>{c.label}</button>)}
        </div>
      </header>
      <button className="banner-only menu-banner" onClick={() => setCat("todos")} aria-label="Monte seu pedido">
        <img src="/menu/banner-text-pedido.png" alt="Monte seu pedido - Entrega rápida pelo WhatsApp" />
      </button>
      {cat === "todos" && (
        <>
          <SectionTitle title="Destaques 🔥" />
          <div className="grid">{DESTAQUES.map((item) => <ProductCard key={item.id} item={item} onClick={() => openProduct(item)} badge="Destaque 🔥" />)}</div>
        </>
      )}
      <SectionTitle title={cat === "todos" ? "Todos os Produtos" : cats.find((c) => c.key === cat)?.label ?? ""} orange />
      <div className="list">
        {items.map((item) => <ListCard key={item.id} item={item} onClick={() => openProduct(item)} />)}
      </div>
      <BottomNav go={go} active="menu" />
    </>
  );
}

function ProductCard({ item, onClick, badge }: { item: MenuItem; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className="product-card">
      <div className="product-art"><img src={item.image} alt={item.name} loading="lazy" />{badge && <b>{badge}</b>}</div>
      <div className="product-body">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <footer><strong>{fmt(item.preco ?? item.broto!)}</strong><i><Plus size={14} /></i></footer>
      </div>
    </button>
  );
}

function ListCard({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="list-card">
      <ProductThumb item={item} size={82} />
      <span className="list-info">
        <h3>{item.name}</h3>
        <p>{item.desc}</p>
        <footer>
          {item.preco !== undefined ? <strong>{fmt(item.preco)}</strong> : <strong>{fmt(item.grande!)} <small>Grande</small> · {fmt(item.broto!)} <small>Broto</small></strong>}
          <i><Plus size={16} /></i>
        </footer>
      </span>
    </button>
  );
}

function ProductThumb({ item, size }: { item: MenuItem; size: number }) {
  return <span className="product-thumb" style={{ width: size, height: size }}><img src={item.image} alt="" loading="lazy" /></span>;
}

function ProductPage({ go, product, size, setSize, qty, setQty, addToCart, cartCount }: { go: (p: Page) => void; product: MenuItem; size: "grande" | "broto" | "unico"; setSize: (s: "grande" | "broto" | "unico") => void; qty: number; setQty: (n: number) => void; addToCart: () => void; cartCount: number }) {
  const price = product.preco ?? (size === "grande" ? product.grande! : product.broto!);

  return (
    <>
      <InnerHeader title="Detalhes do produto" subtitle="Monte do seu jeito" back={() => go("menu")} cart={() => go("cart")} cartCount={cartCount} />
      <div className="detail-art"><img src={product.image} alt={product.name} /></div>
      <main className="detail-body">
        <span className={`badge ${product.cat}`}>{product.cat === "classicas" ? "Clássicas" : product.cat}</span>
        <h1>{product.name}</h1>
        <p>{product.desc}</p>
        <strong className="price">{fmt(price)}</strong>
        {product.preco === undefined && (
          <section className="chooser">
            <h2>Escolha o tamanho</h2>
            {[
              { key: "grande" as const, label: "Grande", price: product.grande, desc: "8 fatias · ~35cm" },
              { key: "broto" as const, label: "Broto", price: product.broto, desc: "6 fatias · ~25cm" },
            ].map((opt) => (
              <button key={opt.key} onClick={() => setSize(opt.key)} className={size === opt.key ? "active" : ""}>
                <span><b>{opt.label}</b><small>{opt.desc}</small></span><strong>{fmt(opt.price!)}</strong>
              </button>
            ))}
          </section>
        )}
        <QtyControl qty={qty} setQty={setQty} />
      </main>
      <StickyButton onClick={addToCart}><ShoppingCart size={18} /> Adicionar · {fmt(price * qty)}</StickyButton>
    </>
  );
}

function CartPage({ go, cart, total, updateQty }: { go: (p: Page) => void; cart: CartItem[]; total: number; updateQty: (key: string, delta: number) => void }) {
  return (
    <>
      <InnerHeader title="Meu Carrinho" subtitle={`${cart.length} ${cart.length === 1 ? "item" : "itens"}`} back={() => go("menu")} />
      <main className="cart-page">
        {cart.length === 0 ? (
          <div className="empty">
            <div>🛒</div>
            <h2>Carrinho vazio</h2>
            <p>Adicione pizzas deliciosas ao seu pedido</p>
            <button onClick={() => go("menu")}>Ver Cardápio</button>
          </div>
        ) : (
          <>
            <div className="delivery-card"><Bike size={20} /><span><b>Entrega estimada: 40-60 min</b><small>São Pedro do Turvo - SP</small></span></div>
            {cart.map((item) => (
              <article key={item.key} className="cart-item">
                <span className="cart-thumb"><img src={item.image} alt="" /></span>
                <div><h3>{item.name}</h3><p>{fmt(item.price)} cada</p></div>
                <div className="mini-qty">
                  <button onClick={() => updateQty(item.key, -1)}><Minus size={14} /></button>
                  <b>{item.qty}</b>
                  <button onClick={() => updateQty(item.key, 1)}><Plus size={14} /></button>
                </div>
                <strong>{fmt(item.price * item.qty)}</strong>
              </article>
            ))}
            <Summary cart={cart} total={total} />
          </>
        )}
      </main>
      {cart.length > 0 && <StickyButton onClick={() => go("checkout")}><ChevronRight size={20} /> FINALIZAR PEDIDO · {fmt(total)}</StickyButton>}
    </>
  );
}

function CheckoutPage({ go, cart, total, userData, setUserData, finalizarPedido, dataSaved }: { go: (p: Page) => void; cart: CartItem[]; total: number; userData: UserData; setUserData: (u: UserData) => void; finalizarPedido: (u: UserData) => void; dataSaved: boolean }) {
  const [form, setForm] = useState<UserData>(userData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => setForm(userData), [userData]);

  const set = (k: keyof UserData, v: string | boolean) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.nome.trim()) e.nome = "Campo obrigatório";
    if (!form.sobrenome.trim()) e.sobrenome = "Campo obrigatório";
    if (!form.telefone.trim()) e.telefone = "Campo obrigatório";
    if (!form.endereco.trim()) e.endereco = "Informe o endereço completo";
    if (form.pagamento === "dinheiro" && form.troco && !form.trocoValor.trim()) e.trocoValor = "Informe o valor para troco";
    return e;
  };

  const submit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setUserData(form);
    finalizarPedido(form);
  };

  const saveOnly = () => {
    saveUser(form);
    setUserData(form);
    setJustSaved(true);
    window.setTimeout(() => setJustSaved(false), 2200);
  };

  return (
    <>
      <header className="inner-head">
        <button onClick={() => go("cart")}><ArrowLeft size={18} /></button>
        <span><b>Dados do pedido</b>{dataSaved && <small><CheckCircle size={10} /> Dados salvos automaticamente</small>}</span>
        <button onClick={saveOnly}>{justSaved ? <CheckCircle size={22} /> : <Save size={22} />}</button>
      </header>
      <main className="checkout">
        <section className="form-card">
          <FormTitle icon={<User size={14} />} title="Dados pessoais" />
          <div className="two">
            <Field label="Nome" value={form.nome} error={errors.nome} onChange={(v) => set("nome", v)} />
            <Field label="Sobrenome" value={form.sobrenome} error={errors.sobrenome} onChange={(v) => set("sobrenome", v)} />
          </div>
          <Field label="Telefone (WhatsApp)" value={form.telefone} error={errors.telefone} onChange={(v) => set("telefone", v)} type="tel" />
          <Field label="Endereço completo" value={form.endereco} error={errors.endereco} onChange={(v) => set("endereco", v)} textarea />
        </section>
        <section className="form-card">
          <FormTitle icon={<CreditCard size={14} />} title="Forma de pagamento" />
          <div className="pay-grid">
            {[
              ["pix", "PIX", "◉"],
              ["dinheiro", "Dinheiro", "💵"],
              ["credito", "Crédito", "💳"],
              ["debito", "Débito", "💳"],
            ].map(([key, label, icon]) => <button key={key} onClick={() => set("pagamento", key)} className={form.pagamento === key ? "active" : ""}>{icon} {label}</button>)}
          </div>
          {form.pagamento === "dinheiro" && (
            <div className="change-box">
              <label><input type="checkbox" checked={form.troco} onChange={(e) => set("troco", e.target.checked)} /> Precisa de troco?</label>
              {form.troco && <Field label="Troco para quanto?" value={form.trocoValor} error={errors.trocoValor} onChange={(v) => set("trocoValor", v)} type="number" />}
            </div>
          )}
        </section>
        <Summary cart={cart} total={total} />
        <p className="save-note"><Save size={12} /> Seus dados serão salvos para facilitar o próximo pedido.</p>
      </main>
      <StickyButton green onClick={submit}>CONFIRMAR VIA WHATSAPP · {fmt(total)}</StickyButton>
    </>
  );
}

function Field({ label, value, error, onChange, type = "text", textarea }: { label: string; value: string; error?: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="field">
      <span>{label}</span>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} /> : <input value={value} onChange={(e) => onChange(e.target.value)} type={type} />}
      {error && <small>{error}</small>}
    </label>
  );
}

function InnerHeader({ title, subtitle, back, cart, cartCount = 0 }: { title: string; subtitle: string; back: () => void; cart?: () => void; cartCount?: number }) {
  return (
    <header className="inner-head">
      <button onClick={back}><ArrowLeft size={18} /></button>
      <span><b>{title}</b><small>{subtitle}</small></span>
      {cart ? <button className="cart-icon" onClick={cart}><ShoppingCart size={22} />{cartCount > 0 && <em>{cartCount}</em>}</button> : <i />}
    </header>
  );
}

function QtyControl({ qty, setQty }: { qty: number; setQty: (n: number) => void }) {
  return (
    <div className="qty">
      <span>Quantidade:</span>
      <button onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
      <b>{qty}</b>
      <button onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
    </div>
  );
}

function Summary({ cart, total }: { cart: CartItem[]; total: number }) {
  return (
    <section className="summary">
      <h2>Resumo</h2>
      {cart.map((item) => <p key={item.key}><span>{item.name} x{item.qty}</span><b>{fmt(item.price * item.qty)}</b></p>)}
      <hr />
      <p><span>Taxa de entrega</span><b className="free">Grátis</b></p>
      <p className="total"><span>TOTAL</span><b>{fmt(total)}</b></p>
    </section>
  );
}

function StickyButton({ children, onClick, green }: { children: React.ReactNode; onClick: () => void; green?: boolean }) {
  return <div className="sticky"><button onClick={onClick} className={green ? "green" : ""}>{children}</button></div>;
}

function SectionTitle({ small, title, orange }: { small?: string; title: string; orange?: boolean }) {
  return <div className="section-title">{small && <p>{small}</p>}<h2 className={orange ? "orange" : ""}>{title}</h2></div>;
}

function FormTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return <div className="form-title">{icon}<h2>{title}</h2></div>;
}

function BottomInfo() {
  return (
    <section className="bottom-info">
      <div><Bike size={18} /><b>Entrega Rápida</b><span>Na sua casa</span></div>
      <div><Clock size={18} /><b>Tempo Médio</b><span>40-60 min</span></div>
      <button onClick={() => window.open("tel:+5514998111853")}><Phone size={18} /><b>Peça Agora</b><span>(14) 99811-1853</span></button>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <a href="https://instagram.com/pizzaria_kaue" target="_blank" rel="noreferrer"><Instagram size={18} /> @pizzaria_kaue</a>
      <p>© 2026 Pizzaria Kaue · Forno a Lenha</p>
    </footer>
  );
}

function BottomNav({ go, active }: { go: (p: Page) => void; active: Page }) {
  return (
    <nav className="bottom-nav">
      <button onClick={() => go("home")} className={active === "home" ? "active" : ""}>Início</button>
      <button onClick={() => go("menu")} className={active === "menu" ? "active" : ""}>Cardápio</button>
      <button onClick={() => go("cart")} className={active === "cart" ? "active" : ""}>Carrinho</button>
    </nav>
  );
}

const globalCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Manrope:wght@500;600;700;800&display=swap');
*{box-sizing:border-box} html,body,#root{width:100%;max-width:100%;min-height:100%;margin:0;overflow-x:hidden;background:${C.bg};overscroll-behavior-x:none} body{position:relative;touch-action:pan-y} button{font:inherit;border:0;cursor:pointer;max-width:100%} img{display:block;max-width:100%}.kaue-app{font-family:'Inter',system-ui,sans-serif;background:linear-gradient(180deg,#080808 0%,#111 48%,#090909 100%);color:${C.white};width:min(100vw,430px);max-width:100vw;min-height:100dvh;margin:0 auto;position:relative;overflow-x:hidden;overflow-y:hidden;contain:layout paint}.kaue-scroll{height:100dvh;width:100%;max-width:100%;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;overscroll-behavior-x:none}.kaue-scroll::-webkit-scrollbar{display:none}
.top,.menu-head,.inner-head{position:sticky;top:0;z-index:50;width:100%;max-width:100%;background:rgba(10,10,10,.9);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,255,255,.08)}.top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px;overflow:hidden}.brand{display:flex;align-items:center;gap:10px;min-width:0;background:transparent;color:${C.white};text-align:left}.brand>span{width:42px;height:42px;flex:0 0 42px;border-radius:50%;display:grid;place-items:center;background:#050505;border:1px solid rgba(255,140,0,.55);overflow:hidden;box-shadow:0 0 22px rgba(255,140,0,.16);padding:3px}.brand>span img{width:100%;height:100%;object-fit:contain;border-radius:50%}.brand strong{min-width:0;font-family:'Manrope',sans-serif;color:${C.white};font-size:18px;font-weight:900;letter-spacing:-.4px;line-height:.95;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.brand small{display:block;color:#48d36f;font-size:9px;font-weight:800;letter-spacing:0;margin-top:3px}.brand.compact>span{width:38px;height:38px;flex-basis:38px;padding:3px}.brand.compact strong{font-size:15px}.top-actions{display:flex;align-items:center;justify-content:flex-end;gap:9px;min-width:0;flex:0 1 auto}.saved{display:none;color:#4caf50;border:1px solid rgba(76,175,80,.35);border-radius:10px;padding:4px 8px;font-size:10px}.delivery{display:flex;align-items:center;gap:5px;white-space:nowrap;background:rgba(255,140,0,.08);border:1px solid rgba(255,140,0,.55);border-radius:18px;color:#ff9b23;font-size:11px;font-weight:800;padding:6px 10px}.cart-icon{background:transparent;color:${C.white};position:relative;padding:5px;flex:0 0 auto}.cart-icon span,.cart-icon em{position:absolute;top:-3px;right:-3px;background:${C.orange};border-radius:50%;width:18px;height:18px;display:grid;place-items:center;font-size:10px;font-style:normal}
.hero{position:relative;display:block;padding:14px 12px 22px;overflow:hidden;background:#080808}.banner-only{display:block;width:100%;padding:0;background:transparent;color:inherit;text-align:left;border:0}.banner-only img{width:100%;height:100%;object-fit:cover;object-position:center;transition:transform .25s ease,filter .25s ease}.banner-only:active img{transform:scale(.985)}.hero-banner{height:auto;aspect-ratio:16/9;border-radius:22px;overflow:hidden;border:1px solid rgba(255,140,0,.22);box-shadow:0 24px 70px rgba(0,0,0,.48),0 0 34px rgba(255,140,0,.1)}
.features{display:grid;grid-template-columns:repeat(4,1fr);background:rgba(18,18,18,.98);border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07)}.features div{padding:16px 5px;text-align:center;border-right:1px solid rgba(255,255,255,.07);font-size:8.5px;color:#c8c8c8;text-transform:uppercase;font-weight:800;letter-spacing:.15px}.features svg,.bottom-info svg{color:${C.orange};display:block;margin:0 auto 6px}.special-banner{margin:16px 12px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,140,0,.2);box-shadow:0 22px 55px rgba(0,0,0,.35);aspect-ratio:16/9}
.section-title{padding:20px 16px 10px}.section-title p{font-size:9.5px;letter-spacing:2.2px;text-transform:uppercase;color:#8f8f8f;margin:0 0 8px;font-weight:900}.section-title h2{font-family:'Manrope';font-size:21px;font-weight:900;letter-spacing:-.55px;margin:0}.section-title h2.orange{color:${C.orange};font-size:14px;text-transform:uppercase;letter-spacing:1.2px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:0 12px 8px}.product-card,.list-card{background:linear-gradient(180deg,rgba(29,29,29,.98),rgba(17,17,17,.98));border:1px solid rgba(255,255,255,.085);border-radius:16px;color:${C.white};overflow:hidden;text-align:left;transition:transform .12s ease,border-color .2s ease,box-shadow .2s ease;box-shadow:0 18px 42px rgba(0,0,0,.26)}.product-card:active,.list-card:active,.sticky button:active{transform:scale(.975)}.product-art{position:relative;height:132px;overflow:hidden;background:#111}.product-art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 44%,rgba(0,0,0,.68))}.product-art img{width:100%;height:100%;object-fit:cover;transition:transform .28s ease}.product-card:active .product-art img{transform:scale(1.04)}.product-art b{position:absolute;top:8px;left:8px;z-index:2;background:rgba(255,140,0,.96);border:1px solid rgba(255,255,255,.18);border-radius:999px;padding:4px 9px;font-size:9px;font-weight:900;color:white;box-shadow:0 8px 18px rgba(255,140,0,.22)}.product-body{padding:12px}.product-body h3,.list-info h3{font-family:'Manrope';font-size:14px;font-weight:900;letter-spacing:-.22px;margin:0 0 5px}.product-body p,.list-info p{color:#a8a8a8;font-size:11px;line-height:1.44;margin:0 0 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.product-body footer,.list-info footer{display:flex;align-items:center;justify-content:space-between;color:${C.orange}}.product-body footer strong,.list-info footer strong{font-weight:900;letter-spacing:-.2px}.product-body i,.list-info i{width:31px;height:31px;border-radius:50%;background:${C.orange};display:grid;place-items:center;color:white;font-style:normal;box-shadow:0 8px 22px rgba(255,140,0,.32)}.list{padding:0 12px 100px}.list-card{width:100%;display:flex;gap:12px;padding:10px;margin-bottom:10px;align-items:center}.product-thumb{border-radius:16px;display:block;flex:0 0 auto;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.08);background:#111}.product-thumb img{width:100%;height:100%;object-fit:cover}.list-info{min-width:0;flex:1}.list-info small{color:${C.gray};font-size:9px;text-transform:uppercase}
.menu-head{padding:14px 16px 10px}.menu-row{display:flex;align-items:center;justify-content:space-between}.delivery-note{background:rgba(255,255,255,.055);border:1px solid rgba(255,255,255,.06);border-radius:12px;color:#b4b4b4;display:flex;align-items:center;gap:6px;font-size:11px;margin:10px 0;padding:9px 12px}.tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none}.tabs::-webkit-scrollbar{display:none}.tabs button{flex:0 0 auto;background:rgba(255,255,255,.075);border:1px solid rgba(255,255,255,.08);border-radius:999px;color:#adadad;font-size:12px;font-weight:750;padding:8px 15px}.tabs button.active{background:${C.orange};border-color:${C.orange};color:${C.white};font-weight:900;box-shadow:0 8px 20px rgba(255,140,0,.24)}.menu-banner{margin:12px;border-radius:20px;overflow:hidden;border:1px solid rgba(255,140,0,.2);box-shadow:0 18px 45px rgba(0,0,0,.3);aspect-ratio:16/9}
.inner-head{display:grid;grid-template-columns:44px minmax(0,1fr) 44px;align-items:center;padding:12px 16px;overflow:hidden}.inner-head>button{width:36px;height:36px;border-radius:11px;background:${C.bgCard};border:1px solid rgba(255,255,255,.09);display:grid;place-items:center;color:${C.white}}.inner-head>span{text-align:center;display:grid;min-width:0}.inner-head b{font-family:'Manrope';font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inner-head small{color:${C.gray};font-size:11px;display:flex;gap:4px;align-items:center;justify-content:center;min-width:0;overflow:hidden;text-overflow:ellipsis}.detail-art{height:285px;position:relative;overflow:hidden;background:#111}.detail-art:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 55%,rgba(24,24,24,1))}.detail-art img{width:100%;height:100%;object-fit:cover}.detail-body{background:${C.bgCard};padding:20px 18px 120px;overflow:hidden}.badge{display:inline-block;border-radius:999px;border:1px solid ${C.orange};color:${C.orange};font-size:11px;font-weight:800;padding:5px 12px;text-transform:capitalize}.badge.classicas{background:${C.orange};color:white}.badge.doces{border-color:${C.red};color:#ff8a80}.badge.bebidas{border-color:#29b6f6;color:#29b6f6}.detail-body h1{font-family:'Manrope';font-size:clamp(23px,7vw,29px);font-weight:900;letter-spacing:-.8px;text-transform:uppercase;margin:12px 0 8px;overflow-wrap:anywhere}.detail-body p{color:#aaa;font-size:13px;line-height:1.65}.price{display:block;color:${C.orange};font-size:29px;font-weight:900;margin:14px 0}.chooser{background:${C.bgCard2};border:1px solid ${C.border};border-radius:14px;padding:14px;margin-bottom:18px;max-width:100%;overflow:hidden}.chooser h2{font-family:'Manrope';font-size:15px;margin:0 0 10px}.chooser button{width:100%;display:flex;justify-content:space-between;align-items:center;gap:10px;background:transparent;border:1px solid ${C.border};border-radius:10px;color:${C.white};padding:12px;margin-top:8px;min-width:0}.chooser button.active{border-color:${C.orange};background:rgba(232,129,10,.1)}.chooser span{display:grid;text-align:left;min-width:0}.chooser small{color:${C.gray};font-size:10px}.qty{display:flex;align-items:center;gap:0;max-width:100%;overflow:hidden}.qty span{margin-right:14px;color:${C.grayLight};font-weight:800}.qty button,.mini-qty button{background:${C.bgCard2};color:${C.orange};width:38px;height:38px}.qty b{width:36px;text-align:center;font-size:18px}.sticky{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100vw,430px);max-width:100vw;background:rgba(12,12,12,.98);backdrop-filter:blur(16px);border-top:1px solid rgba(255,255,255,.08);padding:12px 16px calc(18px + env(safe-area-inset-bottom));z-index:60;overflow:hidden}.sticky button{width:100%;max-width:100%;display:flex;align-items:center;justify-content:center;gap:9px;background:${C.orange};border-radius:14px;color:white;font-weight:900;letter-spacing:.2px;font-size:clamp(12px,3.8vw,15px);line-height:1.15;padding:16px 12px;box-shadow:0 12px 34px rgba(255,140,0,.28);white-space:normal;text-align:center}.sticky button.green{background:#25D366}
.cart-page,.checkout{width:100%;max-width:100%;overflow-x:hidden;padding:16px 16px 145px}.empty{text-align:center;padding-top:80px}.empty div{font-size:64px}.empty h2{font-family:'Manrope';color:${C.grayLight}}.empty p{color:${C.gray}}.empty button{background:${C.orange};color:white;border-radius:12px;padding:12px 28px;font-weight:900}.delivery-card,.cart-item,.summary,.form-card{max-width:100%;background:${C.bgCard};border:1px solid rgba(255,255,255,.08);border-radius:14px}.delivery-card{display:flex;align-items:center;gap:10px;padding:12px 14px;margin-bottom:14px}.delivery-card svg{color:${C.orange};flex:0 0 auto}.delivery-card span{display:grid;min-width:0}.delivery-card small{color:${C.gray}}.cart-item{display:grid;grid-template-columns:46px minmax(0,1fr) auto minmax(52px,64px);align-items:center;gap:8px;padding:10px;margin-bottom:8px;overflow:hidden}.cart-thumb{width:46px;height:46px;border-radius:12px;overflow:hidden;background:#111;display:block;border:1px solid rgba(255,255,255,.08)}.cart-thumb img{width:100%;height:100%;object-fit:cover}.cart-item h3{font-family:'Manrope';font-size:13px;font-weight:900;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cart-item p{color:${C.orange};font-size:12px;margin:4px 0 0}.mini-qty{display:flex;align-items:center;border:1px solid ${C.border};border-radius:8px;overflow:hidden}.mini-qty button{width:28px;height:30px}.mini-qty b{width:22px;text-align:center}.cart-item>strong{text-align:right;font-weight:900;font-size:12px;min-width:0}.summary{padding:16px;margin-top:14px;overflow:hidden}.summary h2{font-family:'Manrope';font-size:14px;color:${C.gray};text-transform:uppercase;letter-spacing:1px;margin:0 0 10px}.summary p{display:flex;justify-content:space-between;gap:12px;color:${C.grayLight};font-size:12px;margin:7px 0;min-width:0}.summary p span{min-width:0;overflow:hidden;text-overflow:ellipsis}.summary hr{border:0;border-top:1px solid ${C.border};margin:12px 0}.summary .free{color:#4caf50}.summary .total{font-family:'Manrope';font-size:18px;color:white}.summary .total b{color:${C.orange};font-size:20px}
.form-card{padding:18px 16px;margin-bottom:14px}.form-title{display:flex;align-items:center;gap:8px;color:${C.orange};margin-bottom:14px}.form-title h2{font-family:'Oswald';font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0}.two{display:grid;grid-template-columns:1fr 1fr;gap:10px}.field{display:block;margin-bottom:12px}.field span{display:block;color:${C.gray};font-size:12px;margin-bottom:6px}.field input,.field textarea{width:100%;background:#111;border:1.5px solid ${C.border};border-radius:10px;color:${C.white};font-size:14px;padding:13px 14px;outline:none;resize:none}.field small{display:block;color:${C.red};font-size:11px;margin-top:4px}.pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pay-grid button{background:#111;border:1.5px solid ${C.border};border-radius:10px;color:${C.grayLight};padding:12px}.pay-grid button.active{background:rgba(232,129,10,.12);border-color:${C.orange};color:${C.orange};font-weight:700}.change-box{border-top:1px solid ${C.border};margin-top:14px;padding-top:14px}.change-box label{display:flex;gap:10px;align-items:center}.save-note{display:flex;align-items:center;justify-content:center;gap:8px;color:${C.gray};font-size:11px;text-align:center}
.bottom-info{display:grid;grid-template-columns:1fr 1fr 1fr;background:${C.bgCard};border-top:1px solid ${C.border};padding:16px 8px;overflow:hidden}.bottom-info div,.bottom-info button{text-align:center;background:transparent;color:${C.white};padding:0 4px;min-width:0}.bottom-info b{display:block;font-family:'Manrope';font-size:10px;font-weight:900;text-transform:uppercase}.bottom-info span{display:block;color:${C.gray};font-size:10px;overflow:hidden;text-overflow:ellipsis}.footer{background:#0a0a0a;border-top:1px solid ${C.border};padding:18px;text-align:center;overflow:hidden}.footer a{display:inline-flex;max-width:100%;gap:10px;align-items:center;color:white;text-decoration:none;background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);border-radius:14px;padding:10px 20px;font-family:'Manrope';font-weight:900}.footer p{color:${C.gray};font-size:10px}.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:min(100vw,430px);max-width:100vw;background:rgba(20,20,20,.97);border-top:1px solid ${C.border};display:grid;grid-template-columns:repeat(3,minmax(0,1fr));z-index:50;overflow:hidden}.bottom-nav button{background:transparent;color:${C.gray};padding:13px 0;font-size:11px;min-width:0}.bottom-nav button.active{color:${C.orange};font-weight:700}
@media (min-width:380px){.saved{display:inline-flex;align-items:center;gap:5px}}@media (max-width:360px){.hero h1 span,.hero h1 strong{font-size:56px}.delivery{display:none}.cart-item{grid-template-columns:34px 1fr auto}.cart-item>strong{grid-column:2/4}.two{grid-template-columns:1fr}}
`;
