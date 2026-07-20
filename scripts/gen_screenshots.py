#!/usr/bin/env python3
"""
CiteMind UI Screenshot Generator
Creates professional mockup screenshots of key app screens for marketing/pitch decks.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# ── Design Tokens ──
W, H = 1440, 900  # Screenshot size (16:10 aspect ratio)

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# Colors
BG_DARK      = hex_to_rgb("#0F172A")      # slate-900
BG_PANEL     = hex_to_rgb("#1E293B")      # slate-800
BG_CARD      = hex_to_rgb("#334155")      # slate-700
BG_HOVER     = hex_to_rgb("#475569")      # slate-600
ACCENT       = hex_to_rgb("#8B5CF6")      # violet-500
ACCENT_LIGHT = hex_to_rgb("#A78BFA")      # violet-400
TEXT_PRIMARY = hex_to_rgb("#F8FAFC")      # slate-50
TEXT_SECOND  = hex_to_rgb("#94A3B8")      # slate-400
TEXT_MUTED   = hex_to_rgb("#64748B")      # slate-500
BORDER       = hex_to_rgb("#334155")      # slate-700
HIGHLIGHT    = hex_to_rgb("#F59E0B")      # amber-500
SUCCESS      = hex_to_rgb("#10B981")      # emerald-500
DANGER       = hex_to_rgb("#EF4444")      # red-500

def get_font(size, bold=False):
    """Try to load a good font, fallback to default."""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                return ImageFont.truetype(fp, size)
            except:
                pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, xy, radius, fill, outline=None, width=1):
    """Draw a rounded rectangle."""
    x1, y1, x2, y2 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def draw_shadow_rect(draw, xy, radius, fill):
    """Draw a card with subtle shadow effect."""
    x1, y1, x2, y2 = xy
    # Shadow
    draw.rounded_rectangle((x1+2, y1+2, x2+2, y2+2), radius=radius, fill=(0,0,0,30))
    # Card
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=BORDER, width=1)

def create_base(title):
    """Create base image with dark background and title bar."""
    img = Image.new('RGB', (W, H), BG_DARK)
    draw = ImageDraw.Draw(img)
    
    # Top title bar (macOS-style window chrome)
    draw.rectangle((0, 0, W, 32), fill=BG_PANEL)
    # Traffic lights
    draw.ellipse((12, 10, 22, 20), fill=DANGER)
    draw.ellipse((28, 10, 38, 20), fill=HIGHLIGHT)
    draw.ellipse((44, 10, 54, 20), fill=SUCCESS)
    
    font_title = get_font(13, bold=True)
    tw = draw.textlength(title, font=font_title)
    draw.text(((W - tw) // 2, 8), title, fill=TEXT_SECOND, font=font_title)
    
    return img, draw

# ═══════════════════════════════════════════════════════════════
# SCREEN 1: LOGIN PAGE
# ═══════════════════════════════════════════════════════════════
def gen_login():
    img, draw = create_base("CiteMind — Sign In")
    
    # Left panel with branding
    draw.rectangle((0, 32, 580, H), fill=BG_PANEL)
    
    # Logo area
    font_logo = get_font(42, bold=True)
    draw.text((60, 180), "CiteMind", fill=TEXT_PRIMARY, font=font_logo)
    
    font_tag = get_font(18)
    draw.text((60, 240), "AI-Powered Research Notebook", fill=ACCENT_LIGHT, font=font_tag)
    
    font_desc = get_font(14)
    desc = [
        "Read. Extract. Connect. Synthesise.",
        "The first research workspace where every AI insight,",
        "every visual connection, and every written note is",
        "automatically traced back to its source document."
    ]
    y = 300
    for line in desc:
        draw.text((60, y), line, fill=TEXT_SECOND, font=font_desc)
        y += 24
    
    # Feature bullets on left
    features = [
        "✓ AI Document Q&A with source citations",
        "✓ Visual knowledge graph & research board",
        "✓ Multi-document synthesis",
        "✓ Professional export to PDF, Word, LaTeX",
    ]
    y = 420
    font_feat = get_font(13)
    for feat in features:
        draw.text((60, y), feat, fill=TEXT_MUTED, font=font_feat)
        y += 28
    
    # Login form on right
    form_x, form_y = 720, 160
    form_w, form_h = 440, 520
    draw_shadow_rect(draw, (form_x, form_y, form_x+form_w, form_y+form_h), 12, BG_PANEL)
    
    font_h2 = get_font(24, bold=True)
    draw.text((form_x+40, form_y+40), "Welcome back", fill=TEXT_PRIMARY, font=font_h2)
    draw.text((form_x+40, form_y+80), "Sign in to your research workspace", fill=TEXT_SECOND, font=font_desc)
    
    # Email input
    draw.text((form_x+40, form_y+140), "Email", fill=TEXT_SECOND, font=font_desc)
    draw_rounded_rect(draw, (form_x+40, form_y+165, form_x+form_w-40, form_y+200), 8, BG_CARD, BORDER)
    draw.text((form_x+55, form_y+173), "researcher@university.edu", fill=TEXT_MUTED, font=font_desc)
    
    # Password input
    draw.text((form_x+40, form_y+220), "Password", fill=TEXT_SECOND, font=font_desc)
    draw_rounded_rect(draw, (form_x+40, form_y+245, form_x+form_w-40, form_y+280), 8, BG_CARD, BORDER)
    draw.text((form_x+55, form_y+253), "••••••••••••", fill=TEXT_MUTED, font=font_desc)
    
    # Sign in button
    draw_rounded_rect(draw, (form_x+40, form_y+320, form_x+form_w-40, form_y+365), 8, ACCENT)
    font_btn = get_font(15, bold=True)
    tw = draw.textlength("Sign In", font=font_btn)
    draw.text((form_x+(form_w-tw)//2, form_y+332), "Sign In", fill=TEXT_PRIMARY, font=font_btn)
    
    # Or divider
    draw.line((form_x+40, form_y+395, form_x+form_w-40, form_y+395), fill=BORDER, width=1)
    draw.text((form_x+40, form_y+410), "Or continue with", fill=TEXT_MUTED, font=font_desc)
    
    # Social buttons
    draw_rounded_rect(draw, (form_x+40, form_y+445, form_x+form_w//2-10, form_y+480), 8, BG_CARD, BORDER)
    draw.text((form_x+80, form_y+453), "Google", fill=TEXT_SECOND, font=font_desc)
    draw_rounded_rect(draw, (form_x+form_w//2+10, form_y+445, form_x+form_w-40, form_y+480), 8, BG_CARD, BORDER)
    draw.text((form_x+form_w//2+50, form_y+453), "GitHub", fill=TEXT_SECOND, font=font_desc)
    
    # Sign up link
    draw.text((form_x+40, form_y+510), "Don't have an account?  Create one free", fill=TEXT_SECOND, font=font_desc)
    
    return img

# ═══════════════════════════════════════════════════════════════
# SCREEN 2: DASHBOARD
# ═══════════════════════════════════════════════════════════════
def gen_dashboard():
    img, draw = create_base("CiteMind — Dashboard")
    
    # Left sidebar
    sidebar_w = 240
    draw.rectangle((0, 32, sidebar_w, H), fill=BG_PANEL)
    
    # Logo in sidebar
    font_logo = get_font(20, bold=True)
    draw.text((20, 50), "◆ CiteMind", fill=ACCENT_LIGHT, font=font_logo)
    
    # Nav items
    nav = [
        ("🏠", "Dashboard", True),
        ("📁", "Projects", False),
        ("📄", "Documents", False),
        ("🤖", "AI Chat", False),
        ("🕸️", "Knowledge Graph", False),
        ("🎨", "Research Board", False),
    ]
    y = 100
    font_nav = get_font(13)
    for icon, label, active in nav:
        if active:
            draw_rounded_rect(draw, (8, y-4, sidebar_w-8, y+28), 6, (ACCENT[0], ACCENT[1], ACCENT[2], 30))
            draw.text((20, y), f"{icon}  {label}", fill=ACCENT_LIGHT, font=font_nav)
        else:
            draw.text((20, y), f"{icon}  {label}", fill=TEXT_SECOND, font=font_nav)
        y += 38
    
    # Bottom sidebar
    draw.line((16, H-100, sidebar_w-16, H-100), fill=BORDER, width=1)
    draw.text((20, H-80), "⚙️  Settings", fill=TEXT_SECOND, font=font_nav)
    draw.text((20, H-50), "👤  Dr. Sarah Chen", fill=TEXT_SECOND, font=font_nav)
    
    # Main content area
    mx = sidebar_w + 30
    my = 60
    
    # Header
    font_h1 = get_font(28, bold=True)
    draw.text((mx, my), "Dashboard", fill=TEXT_PRIMARY, font=font_h1)
    draw.text((mx, my+42), "Welcome back! You have 3 active research projects.", fill=TEXT_SECOND, font=get_font(14))
    
    # Create project button
    draw_rounded_rect(draw, (W-230, my+10, W-30, my+45), 8, ACCENT)
    draw.text((W-200, my+18), "+ New Project", fill=TEXT_PRIMARY, font=get_font(13, bold=True))
    
    # Stats cards
    stats = [("12", "Projects"), ("48", "Documents"), ("156", "Annotations"), ("89", "AI Queries")]
    sx = mx
    for val, label in stats:
        draw_shadow_rect(draw, (sx, my+80, sx+170, my+160), 10, BG_PANEL)
        font_val = get_font(28, bold=True)
        draw.text((sx+20, my+95), val, fill=ACCENT_LIGHT, font=font_val)
        draw.text((sx+20, my+130), label, fill=TEXT_MUTED, font=get_font(12))
        sx += 190
    
    # Recent Projects section
    draw.text((mx, my+190), "Recent Projects", fill=TEXT_PRIMARY, font=get_font(18, bold=True))
    draw.text((mx+160, my+195), "View all →", fill=ACCENT_LIGHT, font=get_font(12))
    
    # Project cards
    projects = [
        ("Climate Policy Analysis 2024", "8 docs · Updated 2h ago", HIGHLIGHT),
        ("Neuroscience Literature Review", "12 docs · Updated yesterday", ACCENT),
        ("Patent Landscape: Quantum Computing", "5 docs · Updated 3d ago", SUCCESS),
    ]
    px = mx
    for name, meta, color in projects:
        draw_shadow_rect(draw, (px, my+230, px+300, my+330), 10, BG_PANEL)
        # Color indicator
        draw.rounded_rectangle((px+15, my+245, px+19, my+280), radius=2, fill=color)
        # Title
        font_name = get_font(14, bold=True)
        draw.text((px+30, my+245), name, fill=TEXT_PRIMARY, font=font_name)
        draw.text((px+30, my+270), meta, fill=TEXT_MUTED, font=get_font(12))
        # Progress bar
        draw_rounded_rect(draw, (px+30, my+300, px+270, my+312), 4, BG_CARD)
        draw_rounded_rect(draw, (px+30, my+300, px+30+int(240*0.7), my+312), 4, color)
        px += 320
    
    # Recent Activity
    draw.text((mx, my+360), "Recent Activity", fill=TEXT_PRIMARY, font=get_font(18, bold=True))
    activities = [
        "📝  Highlighted 3 passages in 'IPCC Report 2024'",
        "🤖  Asked AI about 'carbon pricing mechanisms'",
        "🔗  Connected 'Neural Networks' to 'Deep Learning' in graph",
        "📤  Exported 'Literature Review' to PDF",
        "📥  Uploaded 'Quantum Error Correction Survey'",
    ]
    ay = my+395
    for act in activities:
        draw.text((mx, ay), act, fill=TEXT_SECOND, font=get_font(13))
        ay += 30
    
    return img

# ═══════════════════════════════════════════════════════════════
# SCREEN 3: PROJECT WORKSPACE (PDF + AI Chat)
# ═══════════════════════════════════════════════════════════════
def gen_workspace():
    img, draw = create_base("CiteMind — Project: Climate Policy Analysis")
    
    # Top toolbar
    draw.rectangle((0, 32, W, 72), fill=BG_PANEL)
    draw.text((20, 42), "◆ CiteMind", fill=ACCENT_LIGHT, font=get_font(14, bold=True))
    draw.text((140, 44), "/  Climate Policy Analysis 2024", fill=TEXT_SECOND, font=get_font(13))
    
    # Toolbar buttons
    draw_rounded_rect(draw, (W-320, 38, W-230, 66), 6, BG_CARD)
    draw.text((W-305, 45), "💬 AI Chat", fill=TEXT_SECOND, font=get_font(12))
    draw_rounded_rect(draw, (W-220, 38, W-130, 66), 6, BG_CARD)
    draw.text((W-205, 45), "🕸️ Graph", fill=TEXT_SECOND, font=get_font(12))
    draw_rounded_rect(draw, (W-120, 38, W-20, 66), 6, ACCENT)
    draw.text((W-105, 45), "Export", fill=TEXT_PRIMARY, font=get_font(12, bold=True))
    
    # Left: PDF Viewer
    pdf_x, pdf_y = 0, 72
    pdf_w = int(W * 0.55)
    pdf_h = H - 72
    draw.rectangle((pdf_x, pdf_y, pdf_w, pdf_h), fill=(250, 248, 245))  # Paper color
    
    # PDF content simulation
    font_pdf = get_font(11)
    font_pdf_b = get_font(11, bold=True)
    font_pdf_h = get_font(16, bold=True)
    
    # Page margins
    px, py = pdf_x + 60, pdf_y + 40
    pw = pdf_w - 120
    
    # Title
    draw.text((px, py), "Climate Change 2024: Synthesis Report", fill=(30,30,30), font=font_pdf_h)
    draw.text((px, py+30), "Intergovernmental Panel on Climate Change", fill=(100,100,100), font=font_pdf)
    draw.line((px, py+55, px+pw, py+55), fill=(200,200,200), width=1)
    
    # Simulated text paragraphs
    paragraphs = [
        "1.1  Observed Warming and its Causes",
        "Human activities, principally through emissions of greenhouse gases, have",
        "unequivocally caused global warming...",
        "",
        "The global surface temperature has increased by 1.1°C relative to 1850-1900",
        "levels, with larger increases over land than over the ocean...",
        "",
        "1.2  Current State of the Climate",
        "Climate change is already affecting every region on Earth, with changes",
        "observed in both the atmosphere and the ocean...",
    ]
    ly = py + 75
    for para in paragraphs:
        if para.startswith("1."):
            draw.text((px, ly), para, fill=(30,30,30), font=font_pdf_b)
        else:
            draw.text((px, ly), para, fill=(60,60,60), font=font_pdf)
        ly += 20
    
    # Highlighted text (yellow background)
    highlight_y = py + 155
    draw.rectangle((px-2, highlight_y-2, px+420, highlight_y+16), fill=(255, 235, 100))
    draw.text((px, highlight_y), "The global surface temperature has increased by 1.1°C", fill=(30,30,30), font=font_pdf)
    
    # Annotation indicator
    draw.ellipse((px+430, highlight_y+2, px+442, highlight_y+14), fill=ACCENT)
    
    # Right: AI Chat Panel
    chat_x = pdf_w
    chat_w = W - pdf_w
    draw.rectangle((chat_x, 72, W, H), fill=BG_PANEL)
    
    # Chat header
    draw.rectangle((chat_x, 72, W, 110), fill=BG_PANEL)
    draw.text((chat_x+20, 82), "AI Research Assistant", fill=TEXT_PRIMARY, font=get_font(15, bold=True))
    draw.text((chat_x+20, 104), "GPT-4o · Sources enabled", fill=TEXT_MUTED, font=get_font(11))
    
    # Chat messages
    # User message
    msg_y = 130
    draw_rounded_rect(draw, (chat_x+50, msg_y, chat_x+chat_w-20, msg_y+50), 10, BG_CARD)
    draw.text((chat_x+65, msg_y+15), "What does this report say about carbon pricing?", fill=TEXT_PRIMARY, font=get_font(12))
    
    # AI response
    msg_y = 200
    draw_rounded_rect(draw, (chat_x+20, msg_y, chat_x+chat_w-50, msg_y+140), 10, (ACCENT[0], ACCENT[1], ACCENT[2], 20))
    
    ai_text = [
        "The report identifies carbon pricing as a key mitigation",
        "instrument. Key findings:",
        "",
        "• Carbon taxes and cap-and-trade systems can reduce",
        "  emissions cost-effectively (high confidence)",
        "• Current prices ($2-137/tCO2) remain below optimal",
        "  levels needed for 1.5°C pathways",
        "",
        "Source: Section 4.3.2, page 142"
    ]
    ly = msg_y + 15
    for line in ai_text:
        color = ACCENT_LIGHT if line.startswith("Source:") else TEXT_PRIMARY
        draw.text((chat_x+35, ly), line, fill=color, font=get_font(11))
        ly += 18
    
    # Source badge
    draw_rounded_rect(draw, (chat_x+35, msg_y+125, chat_x+200, msg_y+145), 4, BG_CARD, BORDER)
    draw.text((chat_x+42, msg_y+128), "📄 IPCC 2024 · p.142", fill=TEXT_MUTED, font=get_font(10))
    
    # Input box
    input_y = H - 70
    draw_rounded_rect(draw, (chat_x+15, input_y, chat_x+chat_w-15, input_y+45), 8, BG_CARD, BORDER)
    draw.text((chat_x+30, input_y+14), "Ask anything about your documents...", fill=TEXT_MUTED, font=get_font(12))
    draw_rounded_rect(draw, (chat_x+chat_w-60, input_y+8, chat_x+chat_w-20, input_y+37), 6, ACCENT)
    draw.text((chat_x+chat_w-50, input_y+15), "➤", fill=TEXT_PRIMARY, font=get_font(12, bold=True))
    
    return img

# ═══════════════════════════════════════════════════════════════
# SCREEN 4: KNOWLEDGE GRAPH
# ═══════════════════════════════════════════════════════════════
def gen_knowledge_graph():
    img, draw = create_base("CiteMind — Knowledge Graph")
    
    # Top toolbar
    draw.rectangle((0, 32, W, 72), fill=BG_PANEL)
    draw.text((20, 42), "◆ CiteMind", fill=ACCENT_LIGHT, font=get_font(14, bold=True))
    draw.text((140, 44), "/  Knowledge Graph", fill=TEXT_SECOND, font=get_font(13))
    
    # Left sidebar (graph controls)
    sidebar_w = 280
    draw.rectangle((0, 72, sidebar_w, H), fill=BG_PANEL)
    
    draw.text((20, 90), "Graph Filters", fill=TEXT_PRIMARY, font=get_font(15, bold=True))
    
    filters = [
        ("📄 Documents", True),
        ("🏷️ Entities", True),
        ("🔗 Relationships", True),
        ("📝 Annotations", False),
        ("💬 AI Insights", True),
    ]
    fy = 130
    for label, checked in filters:
        box_color = ACCENT if checked else BG_CARD
        draw.rounded_rectangle((20, fy, 40, fy+16), radius=3, fill=box_color, outline=BORDER)
        if checked:
            draw.text((25, fy+2), "✓", fill=TEXT_PRIMARY, font=get_font(10))
        draw.text((50, fy), label, fill=TEXT_SECOND, font=get_font(12))
        fy += 32
    
    draw.line((20, fy+10, sidebar_w-20, fy+10), fill=BORDER, width=1)
    fy += 30
    
    draw.text((20, fy), "Entities Found", fill=TEXT_PRIMARY, font=get_font(15, bold=True))
    fy += 35
    entities = [
        ("Carbon Pricing", HIGHLIGHT, 12),
        ("Neural Networks", ACCENT, 8),
        ("Deep Learning", ACCENT, 7),
        ("IPCC", SUCCESS, 6),
        ("1.5°C Pathway", HIGHLIGHT, 5),
        ("Cap-and-Trade", HIGHLIGHT, 4),
        ("Quantum Error Correction", ACCENT, 3),
    ]
    for name, color, count in entities:
        draw.ellipse((20, fy+4, 30, fy+14), fill=color)
        draw.text((38, fy), name, fill=TEXT_SECOND, font=get_font(12))
        draw.text((sidebar_w-50, fy), str(count), fill=TEXT_MUTED, font=get_font(11))
        fy += 26
    
    # Graph canvas
    gx, gy = sidebar_w, 72
    gw, gh = W - sidebar_w, H - 72
    draw.rectangle((gx, gy, gx+gw, gy+gh), fill=BG_DARK)
    
    # Draw nodes
    import random
    random.seed(42)
    nodes = [
        ("Climate Policy", gx+gw//2, gy+gh//2, ACCENT, 24),
        ("Carbon Pricing", gx+gw//2-180, gy+gh//2-120, HIGHLIGHT, 18),
        ("IPCC Report", gx+gw//2+200, gy+gh//2-100, SUCCESS, 18),
        ("Neural Networks", gx+gw//2-150, gy+gh//2+130, ACCENT, 16),
        ("Deep Learning", gx+gw//2+100, gy+gh//2+150, ACCENT, 16),
        ("1.5°C Target", gx+gw//2+220, gy+gh//2+20, HIGHLIGHT, 14),
        ("Cap-and-Trade", gx+gw//2-200, gy+gh//2-40, HIGHLIGHT, 14),
        ("Quantum Computing", gx+gw//2-80, gy+gh//2+200, ACCENT, 14),
        ("Error Correction", gx+gw//2+180, gy+gh//2+180, ACCENT, 12),
    ]
    
    # Draw edges first (behind nodes)
    edges = [
        (0, 1), (0, 2), (1, 6), (2, 5), (0, 3), (3, 4), (0, 7), (7, 8)
    ]
    for a, b in edges:
        x1, y1 = nodes[a][1], nodes[a][2]
        x2, y2 = nodes[b][1], nodes[b][2]
        # Draw curved line
        draw.line((x1, y1, x2, y2), fill=BORDER, width=2)
    
    # Draw nodes
    for name, nx, ny, color, size in nodes:
        r = size
        draw.ellipse((nx-r, ny-r, nx+r, ny+r), fill=BG_PANEL, outline=color, width=3)
        font_n = get_font(11, bold=True) if size >= 16 else get_font(10)
        tw = draw.textlength(name, font=font_n)
        draw.text((nx-tw//2, ny-6), name, fill=TEXT_PRIMARY, font=font_n)
    
    # Zoom controls
    draw_rounded_rect(draw, (gx+gw-60, gy+gh-120, gx+gw-20, gy+gh-80), 6, BG_PANEL, BORDER)
    draw.text((gx+gw-48, gy+gh-112), "+", fill=TEXT_PRIMARY, font=get_font(16, bold=True))
    draw_rounded_rect(draw, (gx+gw-60, gy+gh-80, gx+gw-20, gy+gh-40), 6, BG_PANEL, BORDER)
    draw.text((gx+gw-48, gy+gh-72), "−", fill=TEXT_PRIMARY, font=get_font(16, bold=True))
    
    return img

# ═══════════════════════════════════════════════════════════════
# SCREEN 5: RESEARCH BOARD
# ═══════════════════════════════════════════════════════════════
def gen_research_board():
    img, draw = create_base("CiteMind — Research Board")
    
    # Top toolbar
    draw.rectangle((0, 32, W, 72), fill=BG_PANEL)
    draw.text((20, 42), "◆ CiteMind", fill=ACCENT_LIGHT, font=get_font(14, bold=True))
    draw.text((140, 44), "/  Research Board", fill=TEXT_SECOND, font=get_font(13))
    
    # Infinite canvas background
    draw.rectangle((0, 72, W, H), fill=BG_DARK)
    
    # Grid pattern
    for i in range(0, W, 40):
        draw.line((i, 72, i, H), fill=(30, 41, 59), width=1)
    for i in range(72, H, 40):
        draw.line((0, i, W, i), fill=(30, 41, 59), width=1)
    
    # Cards on the board
    cards = [
        (120, 150, 280, 220, "Key Finding", 
         "Carbon pricing needs to reach $130-250/tCO2 by 2030 for 1.5°C pathways",
         HIGHLIGHT, "📄 IPCC 2024 · p.142"),
        (480, 120, 680, 260, "Literature Note",
         "Neural network architectures for climate prediction show 15% improvement over traditional models",
         ACCENT, "📄 Nature Climate · p.45"),
        (140, 420, 340, 540, "Annotation",
         "\"The social cost of carbon is underestimated in current policy frameworks\"",
         HIGHLIGHT, "📄 Science · p.88"),
        (500, 380, 720, 500, "AI Insight",
         "3 papers suggest cap-and-trade outperforms carbon tax in political feasibility",
         ACCENT, "🤖 AI Synthesis"),
        (780, 180, 1000, 320, "Connection",
         "Link between quantum error correction and climate modeling algorithms",
         SUCCESS, "🔗 Manual"),
        (820, 450, 1040, 570, "Question",
         "How do developing countries implement carbon pricing without hurting growth?",
         HIGHLIGHT, "❓ User"),
    ]
    
    for cx, cy, cw, ch, title, body, color, source in cards:
        draw_shadow_rect(draw, (cx, cy, cw, ch), 10, BG_PANEL)
        # Color strip on left
        draw.rectangle((cx, cy, cx+4, ch), fill=color)
        # Title
        draw.text((cx+15, cy+12), title, fill=color, font=get_font(11, bold=True))
        # Body
        words = body.split()
        lines = []
        line = []
        font_body = get_font(11)
        for word in words:
            test = ' '.join(line + [word])
            if draw.textlength(test, font=font_body) < (cw - cx - 30):
                line.append(word)
            else:
                lines.append(' '.join(line))
                line = [word]
        if line:
            lines.append(' '.join(line))
        ly = cy + 35
        for line in lines[:4]:  # max 4 lines
            draw.text((cx+15, ly), line, fill=TEXT_PRIMARY, font=font_body)
            ly += 18
        # Source
        draw.text((cx+15, ch-22), source, fill=TEXT_MUTED, font=get_font(9))
    
    # Connection lines between cards
    draw.line((280, 260, 480, 220), fill=ACCENT, width=2)
    draw.line((340, 480, 500, 450), fill=ACCENT, width=2)
    draw.line((680, 220, 780, 250), fill=SUCCESS, width=2)
    
    # Floating toolbar
    draw_rounded_rect(draw, (W-200, H-80, W-20, H-40), 8, BG_PANEL, BORDER)
    tools = ["🔍", "📝", "🔗", "🤖", "📤"]
    tx = W - 190
    for t in tools:
        draw.text((tx, H-72), t, fill=TEXT_SECOND, font=get_font(14))
        tx += 34
    
    return img

# ═══════════════════════════════════════════════════════════════
# SCREEN 6: EXPORT SCREEN
# ═══════════════════════════════════════════════════════════════
def gen_export():
    img, draw = create_base("CiteMind — Export")
    
    # Centered card
    card_w, card_h = 600, 500
    cx, cy = (W - card_w) // 2, (H - card_h) // 2
    draw_shadow_rect(draw, (cx, cy, cx+card_w, cy+card_h), 16, BG_PANEL)
    
    # Header
    draw.text((cx+30, cy+30), "Export Research", fill=TEXT_PRIMARY, font=get_font(24, bold=True))
    draw.text((cx+30, cy+65), "Choose your export format and citation style", fill=TEXT_SECOND, font=get_font(13))
    
    # Format options
    formats = [
        ("📄", "PDF Document", "Formatted with citations and annotations"),
        ("📝", "Markdown", "Plain text with markdown formatting"),
        ("📊", "Word (.docx)", "Microsoft Word with formatted citations"),
        ("📑", "LaTeX", "Academic LaTeX with BibTeX"),
    ]
    fx, fy = cx+30, cy+110
    for icon, name, desc in formats:
        draw_rounded_rect(draw, (fx, fy, fx+card_w-60, fy+60), 8, BG_CARD, BORDER)
        draw.text((fx+15, fy+10), f"{icon}  {name}", fill=TEXT_PRIMARY, font=get_font(13, bold=True))
        draw.text((fx+15, fy+35), desc, fill=TEXT_MUTED, font=get_font(11))
        # Radio button
        draw.ellipse((fx+card_w-85, fy+20, fx+card_w-65, fy+40), outline=ACCENT, width=2)
        if name == "PDF Document":
            draw.ellipse((fx+card_w-80, fy+25, fx+card_w-70, fy+35), fill=ACCENT)
        fy += 75
    
    # Citation style
    draw.text((cx+30, fy+10), "Citation Style", fill=TEXT_PRIMARY, font=get_font(14, bold=True))
    styles = ["APA 7th", "MLA 9th", "Chicago", "IEEE", "Harvard"]
    sx = cx + 30
    for s in styles:
        if s == "APA 7th":
            draw_rounded_rect(draw, (sx, fy+40, sx+90, fy+70), 6, ACCENT)
            draw.text((sx+10, fy+47), s, fill=TEXT_PRIMARY, font=get_font(11, bold=True))
        else:
            draw_rounded_rect(draw, (sx, fy+40, sx+90, fy+70), 6, BG_CARD, BORDER)
            draw.text((sx+10, fy+47), s, fill=TEXT_SECOND, font=get_font(11))
        sx += 100
    
    # Export button
    draw_rounded_rect(draw, (cx+30, cy+card_h-70, cx+card_w-30, cy+card_h-25), 8, ACCENT)
    font_btn = get_font(15, bold=True)
    tw = draw.textlength("Export PDF Document", font=font_btn)
    draw.text((cx+(card_w-tw)//2, cy+card_h-58), "Export PDF Document", fill=TEXT_PRIMARY, font=font_btn)
    
    return img

# ═══════════════════════════════════════════════════════════════
# SCREEN 7: SETTINGS
# ═══════════════════════════════════════════════════════════════
def gen_settings():
    img, draw = create_base("CiteMind — Settings")
    
    # Layout: sidebar + main
    sidebar_w = 260
    draw.rectangle((0, 32, sidebar_w, H), fill=BG_PANEL)
    
    # Sidebar nav
    draw.text((20, 55), "⚙️ Settings", fill=TEXT_PRIMARY, font=get_font(16, bold=True))
    
    settings_nav = [
        ("👤  Profile", True),
        ("🎨  Appearance", False),
        ("📄  PDF Viewer", False),
        ("🤖  AI Preferences", False),
        ("🔔  Notifications", False),
        ("🔐  Security", False),
        ("💳  Billing", False),
    ]
    sy = 100
    for label, active in settings_nav:
        if active:
            draw_rounded_rect(draw, (10, sy-4, sidebar_w-10, sy+28), 6, (ACCENT[0], ACCENT[1], ACCENT[2], 30))
            draw.text((25, sy), label, fill=ACCENT_LIGHT, font=get_font(12))
        else:
            draw.text((25, sy), label, fill=TEXT_SECOND, font=get_font(12))
        sy += 38
    
    # Main content
    mx = sidebar_w + 40
    my = 60
    
    draw.text((mx, my), "Profile Settings", fill=TEXT_PRIMARY, font=get_font(22, bold=True))
    
    # Avatar
    draw.ellipse((mx, my+50, mx+70, my+120), fill=ACCENT)
    draw.text((mx+22, my+72), "SC", fill=TEXT_PRIMARY, font=get_font(18, bold=True))
    draw.text((mx+85, my+65), "Dr. Sarah Chen", fill=TEXT_PRIMARY, font=get_font(15, bold=True))
    draw.text((mx+85, my+88), "sarah.chen@university.edu", fill=TEXT_MUTED, font=get_font(12))
    draw.text((mx+85, my+108), "Researcher · Premium Plan", fill=ACCENT_LIGHT, font=get_font(11))
    
    # Form fields
    fields = [
        ("Full Name", "Dr. Sarah Chen"),
        ("Email", "sarah.chen@university.edu"),
        ("Institution", "Stanford University"),
        ("Role", "Research Scientist"),
    ]
    fy = my + 150
    for label, value in fields:
        draw.text((mx, fy), label, fill=TEXT_SECOND, font=get_font(12))
        draw_rounded_rect(draw, (mx, fy+22, mx+500, fy+55), 8, BG_CARD, BORDER)
        draw.text((mx+15, fy+30), value, fill=TEXT_PRIMARY, font=get_font(12))
        fy += 72
    
    # Save button
    draw_rounded_rect(draw, (mx, fy+10, mx+140, fy+45), 8, ACCENT)
    draw.text((mx+38, fy+18), "Save Changes", fill=TEXT_PRIMARY, font=get_font(12, bold=True))
    
    # Plan card on right
    px = mx + 560
    draw_shadow_rect(draw, (px, my+50, px+280, my+280), 12, BG_PANEL)
    draw.text((px+20, my+65), "Current Plan", fill=TEXT_PRIMARY, font=get_font(14, bold=True))
    draw.text((px+20, my+95), "Premium", fill=ACCENT_LIGHT, font=get_font(20, bold=True))
    draw.text((px+20, my+125), "$19/month", fill=TEXT_SECOND, font=get_font(14))
    
    draw.line((px+20, my+155, px+260, my+155), fill=BORDER, width=1)
    
    benefits = ["✓ Unlimited projects", "✓ AI-powered insights", "✓ Knowledge graph", "✓ All export formats"]
    by = my + 170
    for b in benefits:
        draw.text((px+20, by), b, fill=TEXT_SECOND, font=get_font(11))
        by += 24
    
    draw_rounded_rect(draw, (px+20, my+280, px+260, my+310), 6, BG_CARD, BORDER)
    draw.text((px+55, my+287), "Manage Subscription", fill=TEXT_SECOND, font=get_font(11))
    
    return img

# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════
if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "assets", "screenshots")
    os.makedirs(out_dir, exist_ok=True)
    
    screens = [
        ("01-login", gen_login),
        ("02-dashboard", gen_dashboard),
        ("03-workspace", gen_workspace),
        ("04-knowledge-graph", gen_knowledge_graph),
        ("05-research-board", gen_research_board),
        ("06-export", gen_export),
        ("07-settings", gen_settings),
    ]
    
    for name, fn in screens:
        img = fn()
        path = os.path.join(out_dir, f"{name}.png")
        img.save(path, "PNG")
        print(f"✓ Saved {path}")
    
    print(f"\n✅ All {len(screens)} screenshots generated in: {out_dir}")
