<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>Paysbillz - Dashboard</title>
    <style>
        /* ===== CSS VARIABLES ===== */
        :root {
            --bg-primary: #0f0f1a;
            --bg-secondary: #1a1a2e;
            --bg-card: rgba(255, 255, 255, 0.04);
            --bg-card-hover: rgba(255, 255, 255, 0.07);
            --bg-input: rgba(0, 0, 0, 0.3);
            --border-color: rgba(255, 255, 255, 0.06);
            --text-primary: #ecf3ff;
            --text-secondary: #b8c7e6;
            --text-muted: #5a6f8a;
            --gold: #ffd700;
            --gold-gradient: linear-gradient(135deg, #f7971e, #ffd200);
            --shadow: 0 25px 60px rgba(0, 0, 0, 0.8);
            --glass-bg: rgba(255, 255, 255, 0.04);
            --transaction-bg: rgba(255, 255, 255, 0.03);
            --transaction-hover: rgba(255, 255, 255, 0.06);
            --daily-color: #4ecdc4;
            --weekly-color: #ffd93d;
            --monthly-color: #6bcb77;
            --accent: #4ecdc4;
        }

        [data-theme="light"] {
            --bg-primary: #f0f4fa;
            --bg-secondary: #ffffff;
            --bg-card: rgba(0, 0, 0, 0.03);
            --bg-card-hover: rgba(0, 0, 0, 0.06);
            --bg-input: rgba(0, 0, 0, 0.05);
            --border-color: rgba(0, 0, 0, 0.08);
            --text-primary: #1a1a2e;
            --text-secondary: #3a4a5e;
            --text-muted: #7a8a9e;
            --shadow: 0 25px 60px rgba(0, 0, 0, 0.1);
            --glass-bg: rgba(255, 255, 255, 0.7);
            --transaction-bg: rgba(0, 0, 0, 0.02);
            --transaction-hover: rgba(0, 0, 0, 0.04);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', 'Segoe UI', system-ui, sans-serif; }

        body {
            background: var(--bg-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            padding: 25px 12px;
            transition: background 0.3s;
        }

        .container {
            max-width: 720px;
            width: 100%;
            background: var(--bg-secondary);
            border-radius: 32px;
            padding: 28px 22px 38px;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow);
            transition: background 0.3s;
        }

        /* ===== HEADER ===== */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 12px;
        }

        .header-left h1 {
            font-size: 28px;
            font-weight: 800;
            background: var(--gold-gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }

        .header-left .sub {
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
            font-size: 13px;
            flex-wrap: wrap;
        }

        .header-left .sub .badge {
            background: rgba(255, 215, 0, 0.12);
            padding: 2px 14px;
            border-radius: 40px;
            border: 1px solid rgba(255, 215, 0, 0.2);
            color: var(--gold);
            font-weight: 500;
            font-size: 12px;
            -webkit-text-fill-color: var(--gold);
        }

        .header-right {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .theme-toggle, .logout-btn {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 8px 14px;
            border-radius: 40px;
            cursor: pointer;
            font-size: 16px;
            transition: 0.25s;
        }

        .theme-toggle:hover { background: var(--bg-card-hover); border-color: var(--gold); }
        .logout-btn:hover { background: rgba(255, 50, 50, 0.15); border-color: #ff6b6b; color: #ff6b6b; }

        /* ===== BALANCE CARDS ===== */
        .balance-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin: 16px 0;
        }

        @media (max-width: 480px) {
            .balance-grid { grid-template-columns: 1fr 1fr; }
        }

        .balance-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 14px;
            text-align: center;
            transition: 0.25s;
        }

        .balance-card:hover { background: var(--bg-card-hover); }

        .balance-card .label {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .balance-card .amount {
            font-size: 22px;
            font-weight: 700;
            color: var(--gold);
            margin-top: 4px;
        }

        .balance-card .amount.wallet { color: #4ecdc4; }
        .balance-card .amount.profit { color: #ffd93d; }

        /* ===== VIRTUAL ACCOUNT CARD ===== */
        .virtual-account-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 16px 20px;
            margin: 16px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            cursor: pointer;
            transition: 0.25s;
            border-left: 3px solid var(--gold);
        }

        .virtual-account-card:hover {
            background: var(--bg-card-hover);
            border-color: var(--gold);
        }

        .virtual-account-card .label {
            font-size: 11px;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .virtual-account-card .account-number {
            font-size: 20px;
            font-weight: 700;
            color: var(--gold);
            letter-spacing: 2px;
        }

        .virtual-account-card .bank-name {
            font-size: 12px;
            color: var(--text-muted);
            margin-top: 2px;
        }

        .virtual-account-card .copy-btn {
            background: var(--gold-gradient);
            border: none;
            color: #0f0f1a;
            padding: 6px 16px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            transition: 0.25s;
        }

        .virtual-account-card .copy-btn:hover {
            transform: scale(1.05);
        }

        /* ===== KYC STATUS ===== */
        .kyc-status {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            padding: 12px 16px;
            margin: 12px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
        }

        .kyc-status .tier-badge {
            padding: 4px 14px;
            border-radius: 40px;
            font-size: 12px;
            font-weight: 600;
        }

        .kyc-status .tier-badge.tier1 { background: rgba(158, 158, 158, 0.2); color: #9e9e9e; }
        .kyc-status .tier-badge.tier2 { background: rgba(33, 150, 243, 0.2); color: #2196f3; }
        .kyc-status .tier-badge.tier3 { background: rgba(255, 215, 0, 0.2); color: var(--gold); }

        .kyc-status .status-badge.verified { color: #4caf50; }
        .kyc-status .status-badge.pending { color: #ff9800; }
        .kyc-status .status-badge.not_submitted { color: #f44336; }

        /* ===== SERVICE BUTTONS ===== */
        .services-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin: 16px 0;
        }

        @media (max-width: 480px) {
            .services-grid { grid-template-columns: repeat(3, 1fr); }
        }

        .service-btn {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 14px;
            padding: 14px 6px;
            text-align: center;
            cursor: pointer;
            transition: 0.25s;
            color: var(--text-secondary);
        }

        .service-btn:hover {
            background: var(--bg-card-hover);
            border-color: var(--gold);
            transform: translateY(-2px);
            color: var(--text-primary);
        }

        .service-btn .icon { font-size: 28px; display: block; margin-bottom: 4px; }
        .service-btn .name { font-size: 10px; font-weight: 600; }

        .service-btn.primary { background: var(--gold-gradient); color: #0f0f1a; border-color: transparent; }
        .service-btn.primary:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.25); }
        .service-btn.fingerprint { background: rgba(78, 205, 196, 0.15); border-color: rgba(78, 205, 196, 0.2); }
        .service-btn.kyc-btn { background: rgba(255, 215, 0, 0.08); border-color: rgba(255, 215, 0, 0.15); }

        /* ===== FILTER TABS ===== */
        .filter-tabs {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin: 16px 0 14px;
            justify-content: center;
        }

        .filter-btn {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            padding: 6px 16px;
            border-radius: 40px;
            font-weight: 600;
            font-size: 11px;
            cursor: pointer;
            transition: 0.25s;
        }

        .filter-btn:hover { background: rgba(255, 215, 0, 0.08); border-color: rgba(255, 215, 0, 0.25); color: var(--text-primary); }
        .filter-btn.active { background: var(--gold-gradient); color: #0f0f1a; border-color: transparent; box-shadow: 0 4px 20px rgba(255, 215, 0, 0.25); }

        /* ===== PLANS GRID ===== */
        .plans-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 6px;
        }

        @media (max-width: 540px) { .plans-grid { grid-template-columns: 1fr; } }

        .plan-card {
            background: var(--bg-card);
            border-radius: 16px;
            padding: 14px;
            border: 1px solid var(--border-color);
            transition: 0.25s;
            position: relative;
            overflow: hidden;
        }

        .plan-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            transition: 0.3s;
        }
        .plan-card.validity-daily::before { background: var(--daily-color); }
        .plan-card.validity-weekly::before { background: var(--weekly-color); }
        .plan-card.validity-monthly::before { background: var(--monthly-color); }

        .plan-card:hover {
            background: var(--bg-card-hover);
            border-color: rgba(255, 215, 0, 0.15);
            transform: translateY(-2px);
        }

        .plan-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .plan-name { font-weight: 600; font-size: 13px; color: var(--text-primary); line-height: 1.3; }
        .plan-name small { font-weight: 400; font-size: 10px; color: var(--text-muted); display: block; margin-top: 2px; }

        .plan-badge {
            padding: 2px 10px;
            border-radius: 30px;
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
        }
        .plan-badge.daily { background: rgba(78, 205, 196, 0.15); color: var(--daily-color); border: 1px solid rgba(78, 205, 196, 0.2); }
        .plan-badge.weekly { background: rgba(255, 217, 61, 0.15); color: var(--weekly-color); border: 1px solid rgba(255, 217, 61, 0.2); }
        .plan-badge.monthly { background: rgba(107, 203, 119, 0.15); color: var(--monthly-color); border: 1px solid rgba(107, 203, 119, 0.2); }

        .plan-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
        .plan-price { font-size: 18px; font-weight: 700; color: var(--gold); }
        .plan-price small { font-size: 12px; font-weight: 400; color: var(--text-muted); }

        .buy-btn {
            background: var(--gold-gradient);
            border: none;
            color: #0f0f1a;
            font-weight: 700;
            font-size: 12px;
            padding: 6px 18px;
            border-radius: 40px;
            cursor: pointer;
            transition: 0.25s;
        }
        .buy-btn:hover { transform: scale(1.05); box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3); }

        /* ===== MODAL ===== */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .modal.show { display: flex; }

        .modal-content {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 28px;
            max-width: 460px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: var(--shadow);
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        .modal-header h2 { color: var(--text-primary); font-size: 20px; }
        .modal-close {
            background: none;
            border: none;
            color: var(--text-muted);
            font-size: 28px;
            cursor: pointer;
            padding: 0 8px;
        }
        .modal-close:hover { color: var(--text-primary); }

        .modal-content input, .modal-content select {
            width: 100%;
            padding: 12px 16px;
            margin: 6px 0;
            background: var(--bg-input);
            border: 1px solid var(--border-color);
            border-radius: 12px;
            color: var(--text-primary);
            font-size: 14px;
            outline: none;
            transition: 0.2s;
        }
        .modal-content input:focus, .modal-content select:focus {
            border-color: var(--gold);
            box-shadow: 0 0 0 3px rgba(255, 215, 0, 0.08);
        }
        .modal-content input::placeholder { color: var(--text-muted); }

        .modal-btn {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 14px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            transition: 0.25s;
            margin-top: 8px;
            background: var(--gold-gradient);
            color: #0f0f1a;
        }
        .modal-btn:hover { transform: scale(1.02); box-shadow: 0 6px 30px rgba(255, 215, 0, 0.25); }
        .modal-btn.success { background: #2e7d32; color: #fff; }
        .modal-btn.danger { background: #d32f2f; color: #fff; }

        .result-msg {
            margin-top: 10px;
            padding: 12px;
            border-radius: 12px;
            text-align: center;
            font-size: 14px;
            display: none;
        }
        .result-msg.show { display: block; }
        .result-msg.success { background: rgba(46, 125, 50, 0.15); color: #4caf50; border: 1px solid rgba(46, 125, 50, 0.2); }
        .result-msg.error { background: rgba(211, 47, 47, 0.15); color: #ef5350; border: 1px solid rgba(211, 47, 47, 0.2); }
        .result-msg.loading { background: rgba(255, 215, 0, 0.1); color: var(--gold); border: 1px solid rgba(255, 215, 0, 0.15); }

        /* ===== TRANSACTIONS ===== */
        .recent-section {
            margin-top: 24px;
            border-top: 1px solid var(--border-color);
            padding-top: 18px;
        }

        .recent-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            flex-wrap: wrap;
            gap: 8px;
        }
        .recent-header h3 { color: var(--text-primary); font-size: 15px; font-weight: 700; }
        .recent-header h3 span { background: rgba(255, 215, 0, 0.1); padding: 0 12px; border-radius: 40px; font-size: 12px; color: var(--gold); }

        .transaction-list { max-height: 250px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: var(--gold) transparent; }
        .transaction-list::-webkit-scrollbar { width: 4px; }
        .transaction-list::-webkit-scrollbar-thumb { background: var(--gold); border-radius: 10px; }

        .transaction-item {
            background: var(--transaction-bg);
            padding: 10px 14px;
            border-radius: 12px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-left: 3px solid transparent;
            transition: 0.2s;
            flex-wrap: wrap;
            gap: 4px;
        }
        .transaction-item:hover { background: var(--transaction-hover); }
        .transaction-item.data { border-left-color: #4ecdc4; }
        .transaction-item.airtime { border-left-color: #ffd700; }
        .transaction-item.tv { border-left-color: #9c27b0; }
        .transaction-item.electricity { border-left-color: #ff9800; }
        .transaction-item.education { border-left-color: #2196f3; }
        .transaction-item.funding { border-left-color: #4caf50; }
        .transaction-item.withdrawal { border-left-color: #f44336; }
        .transaction-item.virtual_account_funding { border-left-color: #9c27b0; }

        .transaction-name { font-weight: 600; font-size: 13px; color: var(--text-primary); }
        .transaction-detail { font-size: 11px; color: var(--text-muted); }
        .transaction-amount { font-weight: 700; font-size: 15px; color: var(--gold); }
        .transaction-time { font-size: 10px; color: var(--text-muted); }
        .profit-badge { background: rgba(255, 215, 0, 0.1); color: var(--gold); padding: 1px 8px; border-radius: 8px; font-size: 9px; }

        .empty-transactions { text-align: center; color: var(--text-muted); padding: 30px 0; font-size: 14px; }
        .empty-transactions .emoji { font-size: 32px; display: block; margin-bottom: 8px; }

        /* ===== TOAST ===== */
        .toast {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: var(--bg-secondary);
            color: var(--text-primary);
            padding: 12px 24px;
            border-radius: 16px;
            border: 1px solid var(--border-color);
            box-shadow: var(--shadow);
            font-weight: 500;
            font-size: 14px;
            opacity: 0;
            transition: 0.4s ease;
            z-index: 999;
            max-width: 90%;
            text-align: center;
        }
        .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .toast.success { border-left: 4px solid #4ecdc4; }
        .toast.error { border-left: 4px solid #ff6b6b; }

        /* ===== PAYSTACK FUNDING ===== */
        .paystack-info {
            background: rgba(78, 205, 196, 0.05);
            border: 1px solid rgba(78, 205, 196, 0.15);
            border-radius: 12px;
            padding: 16px;
            margin: 12px 0;
        }

        .paystack-info .step {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 6px 0;
            color: var(--text-secondary);
            font-size: 13px;
        }

        .paystack-info .step .num {
            background: var(--gold-gradient);
            color: #0f0f1a;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 12px;
            flex-shrink: 0;
        }

        .paystack-badge {
            display: inline-block;
            background: #4ecdc4;
            color: #0f0f1a;
            padding: 2px 12px;
            border-radius: 40px;
            font-size: 11px;
            font-weight: 700;
        }

        .fingerprint-btn {
            background: var(--bg-card);
            border: 2px solid var(--accent);
            color: var(--text-primary);
            padding: 14px;
            border-radius: 14px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            transition: 0.25s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }

        .fingerprint-btn:hover {
            background: rgba(78, 205, 196, 0.1);
            border-color: var(--gold);
        }

        .fingerprint-btn .icon-large {
            font-size: 32px;
        }

        .fingerprint-btn.scanning {
            animation: pulse 1s infinite;
            border-color: var(--gold);
            background: rgba(255, 215, 0, 0.1);
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>

<!-- ===== TOAST ===== -->
<div class="toast" id="toast"></div>

<div class="container">

    <!-- ===== HEADER ===== -->
    <div class="header">
        <div class="header-left">
            <h1>💰 Paysbillz</h1>
            <div class="sub">
                <span>💡 All Services</span>
                <span style="color:var(--text-dim);">•</span>
                <span class="badge" id="phoneBadge">📞 Loading...</span>
            </div>
        </div>
        <div class="header-right">
            <button class="theme-toggle" onclick="toggleTheme()">
                <span id="themeIcon">🌙</span>
            </button>
            <button class="logout-btn" onclick="logout()">🚪</button>
        </div>
    </div>

    <!-- ===== BALANCE ===== -->
    <div class="balance-grid">
        <div class="balance-card">
            <div class="label">💰 Wallet</div>
            <div class="amount wallet" id="balanceDisplay">₦0.00</div>
        </div>
        <div class="balance-card" id="profitCard">
            <div class="label">📊 Profit</div>
            <div class="amount profit" id="profitDisplay">₦0.00</div>
        </div>
        <div class="balance-card">
            <div class="label">📋 Txns</div>
            <div class="amount" id="txnCount" style="color:var(--text-secondary);">0</div>
        </div>
    </div>

    <!-- ===== VIRTUAL ACCOUNT ===== -->
    <div class="virtual-account-card" onclick="copyAccountNumber()">
        <div>
            <div class="label">🏦 Your Virtual Account</div>
            <div class="account-number" id="virtualAccountDisplay">Loading...</div>
            <div class="bank-name" id="bankNameDisplay">Paystack MFB</div>
        </div>
        <button class="copy-btn" onclick="event.stopPropagation();copyAccountNumber();">📋 Copy</button>
    </div>

    <!-- ===== KYC STATUS ===== -->
    <div class="kyc-status" id="kycStatusDisplay">
        <span>🪪 KYC: <span id="kycTierDisplay">Loading...</span></span>
        <span>Status: <span id="kycStatusText" class="status-badge">Loading...</span></span>
        <span>Daily Limit: <span id="kycDailyLimitDisplay">₦0</span></span>
    </div>

    <!-- ===== SERVICES ===== -->
    <div class="services-grid">
        <button class="service-btn" onclick="openModal('data')"><span class="icon">📱</span><span class="name">Data</span></button>
        <button class="service-btn" onclick="openModal('airtime')"><span class="icon">📞</span><span class="name">Airtime</span></button>
        <button class="service-btn" onclick="openModal('tv')"><span class="icon">📺</span><span class="name">TV</span></button>
        <button class="service-btn" onclick="openModal('electricity')"><span class="icon">💡</span><span class="name">Electricity</span></button>
        <button class="service-btn" onclick="openModal('education')"><span class="icon">📚</span><span class="name">Exam Pins</span></button>
        <button class="service-btn primary" onclick="openModal('fund')"><span class="icon">💳</span><span class="name">Fund Wallet</span></button>
        <button class="service-btn" onclick="openModal('withdraw')"><span class="icon">💸</span><span class="name">Withdraw</span></button>
        <button class="service-btn kyc-btn" onclick="openModal('kyc')"><span class="icon">🪪</span><span class="name">KYC</span></button>
        <button class="service-btn fingerprint" onclick="openModal('fingerprint')" style="grid-column: span 2;"><span class="icon">🔐</span><span class="name">Fingerprint Login</span></button>
    </div>

    <!-- ===== DATA PLANS ===== -->
    <div class="filter-tabs" id="filterContainer">
        <button class="filter-btn active" data-filter="all">🔥 All</button>
        <button class="filter-btn" data-filter="daily">📆 Daily</button>
        <button class="filter-btn" data-filter="weekly">📅 Weekly</button>
        <button class="filter-btn" data-filter="monthly">📊 Monthly</button>
    </div>

    <div class="plans-grid" id="plansGrid"></div>

    <!-- ===== TRANSACTIONS ===== -->
    <div class="recent-section">
        <div class="recent-header">
            <h3>📋 Recent Transactions <span id="txCount">0</span></h3>
        </div>
        <div class="transaction-list" id="transactionList">
            <div class="empty-transactions">
                <span class="emoji">🛒</span>
                No transactions yet.<br />Buy a service to get started!
            </div>
        </div>
    </div>

</div>

<!-- ===== MODAL ===== -->
<div class="modal" id="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Service</h2>
            <button class="modal-close" onclick="closeModal()">&times;</button>
        </div>
        <div id="modalBody"></div>
        <div class="result-msg" id="resultMsg"></div>
    </div>
</div>

<!-- ============================================================ -->
<!-- JAVASCRIPT -->
<script>
// ============================================================
// CONFIGURATION
// ============================================================
const API = window.location.origin || 'https://paysbillz-api.onrender.com';
const ADMIN_PHONE = '08027449527';
let userPhone = localStorage.getItem('userPhone') || '08027449527';
let isAdmin = userPhone === ADMIN_PHONE;
let fingerprintRegistered = false;

// ============================================================
// DATA PLANS
// ============================================================
const allPlans = [
    // ---- DAILY PLANS (AWOOF) - UPDATED ----
    { id: 'd1', name: 'MTN AWOOF 500MB', validity: 'Daily', price: 300, network: 'MTN', profit: 80 },
    { id: 'd2', name: 'MTN AWOOF 1GB', validity: 'Daily', price: 350, network: 'MTN', profit: 90 },
    { id: 'd3', name: 'MTN AWOOF 2.5GB', validity: 'Daily', price: 750, network: 'MTN', profit: 160 },
    { id: 'd4', name: 'MTN AWOOF 5GB', validity: 'Daily', price: 1800, network: 'MTN', profit: 650 },
    { id: 'd5', name: 'MTN AWOOF 10GB', validity: 'Daily', price: 4500, network: 'MTN', profit: 1000 },
    
    // ---- PULSE PLANS ----
    { id: 'd6', name: 'MTN PULSE 500MB', validity: 'Daily', price: 250, network: 'MTN', profit: 100 },
    { id: 'd7', name: 'MTN PULSE 1GB', validity: 'Daily', price: 400, network: 'MTN', profit: 150 },
    { id: 'd8', name: 'MTN PULSE 2GB', validity: 'Weekly', price: 900, network: 'MTN', profit: 200 },
    { id: 'd9', name: 'MTN PULSE 3GB', validity: 'Weekly', price: 1200, network: 'MTN', profit: 250 },
    { id: 'd10', name: 'MTN PULSE 5GB', validity: 'Monthly', price: 2000, network: 'MTN', profit: 500 },
    { id: 'd11', name: 'MTN PULSE 10GB', validity: 'Monthly', price: 3500, network: 'MTN', profit: 700 },
    
    // ---- SHARE PLANS (Weekly) ----
    { id: 'w1', name: 'MTN SHARE 500MB', validity: 'Weekly', price: 450, network: 'MTN', profit: 120 },
    { id: 'w2', name: 'MTN SHARE 1GB', validity: 'Weekly', price: 600, network: 'MTN', profit: 165 },
    { id: 'w3', name: 'MTN SHARE 2GB', validity: 'Weekly', price: 1200, network: 'MTN', profit: 230 },
    { id: 'w4', name: 'MTN SHARE 3GB', validity: 'Weekly', price: 1600, network: 'MTN', profit: 220 },
    { id: 'w5', name: 'MTN SHARE 5GB', validity: 'Weekly', price: 2200, network: 'MTN', profit: 500 },
    
    // ---- GIFTING PLANS (14 Days) ----
    { id: 'g1', name: 'MTN GIFT 500MB', validity: '14 Days', price: 500, network: 'MTN', profit: 100 },
    { id: 'g2', name: 'MTN GIFT 1GB', validity: '14 Days', price: 850, network: 'MTN', profit: 150 },
    { id: 'g3', name: 'MTN GIFT 2GB', validity: '14 Days', price: 1500, network: 'MTN', profit: 200 },
    { id: 'g4', name: 'MTN GIFT 5GB', validity: '14 Days', price: 3200, network: 'MTN', profit: 400 },
    { id: 'g5', name: 'MTN GIFT 10GB', validity: '14 Days', price: 5500, network: 'MTN', profit: 500 },
    
    // ---- MONTHLY SME PLANS ----
    { id: 'm1', name: 'MTN SME 500MB', validity: 'Monthly', price: 600, network: 'MTN', profit: 100 },
    { id: 'm2', name: 'MTN SME 1GB', validity: 'Monthly', price: 1000, network: 'MTN', profit: 200 },
    { id: 'm3', name: 'MTN SME 2GB', validity: 'Monthly', price: 1500, network: 'MTN', profit: 300 },
    { id: 'm4', name: 'MTN SME 3GB', validity: 'Monthly', price: 1900, network: 'MTN', profit: 400 },
    { id: 'm5', name: 'MTN SME 5GB', validity: 'Monthly', price: 2500, network: 'MTN', profit: 500 },
    { id: 'm6', name: 'MTN 10GB', validity: 'Monthly', price: 5000, network: 'MTN', profit: 552 },
    { id: 'm7', name: 'MTN 20GB', validity: 'Monthly', price: 5500, network: 'MTN', profit: 575 },
    { id: 'm8', name: 'MTN 50GB', validity: 'Monthly', price: 19000, network: 'MTN', profit: 1270 },
    { id: 'm9', name: 'MTN 100GB', validity: 'Monthly', price: 26000, network: 'MTN', profit: 1475 },
    
    // ---- AIRTEL PLANS ----
    { id: 'a1', name: 'Airtel AWOOF 150MB', validity: 'Daily', price: 150, network: 'Airtel', profit: 82 },
    { id: 'a2', name: 'Airtel AWOOF 300MB', validity: 'Daily', price: 200, network: 'Airtel', profit: 75 },
    { id: 'a3', name: 'Airtel AWOOF 600MB', validity: 'Daily', price: 350, network: 'Airtel', profit: 120 },
    { id: 'a4', name: 'Airtel AWOOF 10GB', validity: 'Daily', price: 3800, network: 'Airtel', profit: 720 },
    { id: 'a5', name: 'Airtel SmartShare 500MB', validity: 'Daily', price: 280, network: 'Airtel', profit: 100 },
    { id: 'a6', name: 'Airtel SmartShare 1GB', validity: 'Daily', price: 400, network: 'Airtel', profit: 100 },
    { id: 'a7', name: 'Airtel SmartShare 2GB', validity: 'Weekly', price: 1000, network: 'Airtel', profit: 200 },
    { id: 'a8', name: 'Airtel SmartShare 3GB', validity: 'Weekly', price: 1400, network: 'Airtel', profit: 300 },
    { id: 'a9', name: 'Airtel 500MB', validity: 'Monthly', price: 550, network: 'Airtel', profit: 100 },
    { id: 'a10', name: 'Airtel 1GB', validity: 'Monthly', price: 900, network: 'Airtel', profit: 150 },
    { id: 'a11', name: 'Airtel 2GB', validity: 'Monthly', price: 1400, network: 'Airtel', profit: 200 },
    { id: 'a12', name: 'Airtel 3GB', validity: 'Monthly', price: 1800, network: 'Airtel', profit: 300 },
    { id: 'a13', name: 'Airtel 5GB', validity: 'Monthly', price: 2500, network: 'Airtel', profit: 500 },
    { id: 'a14', name: 'Airtel 10GB', validity: 'Monthly', price: 4500, network: 'Airtel', profit: 556 },
    { id: 'a15', name: 'Airtel SmartShare 5GB', validity: 'Monthly', price: 2200, network: 'Airtel', profit: 400 },
    { id: 'a16', name: 'Airtel SmartShare 10GB', validity: 'Monthly', price: 3800, network: 'Airtel', profit: 600 },
    
    // ---- GLO PLANS ----
    { id: 'glo1', name: 'GLO AWOOF 750MB', validity: 'Daily', price: 350, network: 'GLO', profit: 140 },
    { id: 'glo2', name: 'GLO AWOOF 1.5GB', validity: 'Daily', price: 450, network: 'GLO', profit: 135 },
    { id: 'glo3', name: 'GLO AWOOF 2.5GB', validity: 'Daily', price: 700, network: 'GLO', profit: 185 },
    { id: 'glo4', name: 'GLO AWOOF 10GB', validity: 'Daily', price: 2500, network: 'GLO', profit: 580 },
    { id: 'glo5', name: 'GLO 500MB', validity: 'Monthly', price: 500, network: 'GLO', profit: 100 },
    { id: 'glo6', name: 'GLO 1GB', validity: 'Monthly', price: 850, network: 'GLO', profit: 150 },
    { id: 'glo7', name: 'GLO 2GB', validity: 'Monthly', price: 1300, network: 'GLO', profit: 200 },
    { id: 'glo8', name: 'GLO 3GB', validity: 'Monthly', price: 1700, network: 'GLO', profit: 200 },
    { id: 'glo9', name: 'GLO 5GB', validity: 'Monthly', price: 2400, network: 'GLO', profit: 400 },
    { id: 'glo10', name: 'GLO 10GB', validity: 'Monthly', price: 3300, network: 'GLO', profit: 450 },
    
    // ---- 9MOBILE PLANS ----
    { id: 'n1', name: '9mobile 500MB', validity: 'Monthly', price: 450, network: '9mobile', profit: 100 },
    { id: 'n2', name: '9mobile 1GB', validity: 'Monthly', price: 750, network: '9mobile', profit: 150 },
    { id: 'n3', name: '9mobile 2GB', validity: 'Monthly', price: 1200, network: '9mobile', profit: 200 },
    { id: 'n4', name: '9mobile 3GB', validity: 'Monthly', price: 1600, network: '9mobile', profit: 200 },
    { id: 'n5', name: '9mobile 5GB', validity: 'Monthly', price: 2500, network: '9mobile', profit: 500 },
    { id: 'n6', name: '9mobile 10GB', validity: 'Monthly', price: 5500, network: '9mobile', profit: 500 },
];

// ============================================================
// TV PRICES
// ============================================================
const TV_PRICES = {
    '90': { name: 'DSTV Padi', price: 4400, profit: 132 },
    '91': { name: 'DSTV Yanga', price: 6000, profit: 180 },
    '92': { name: 'DSTV Confam', price: 11000, profit: 330 },
    '93': { name: 'DSTV Compact', price: 19000, profit: 570 },
    '105': { name: 'DSTV Compact Plus', price: 30000, profit: 900 },
    '106': { name: 'DSTV Premium', price: 44500, profit: 1335 },
    '94': { name: 'GOTV Smallie', price: 1900, profit: 57 },
    '96': { name: 'GOTV Jolli', price: 5800, profit: 174 },
    '97': { name: 'GOTV Jinja', price: 3900, profit: 117 },
    '95': { name: 'GOTV Max', price: 8500, profit: 255 },
    '112': { name: 'GOTV Supa', price: 9000, profit: 270 },
};

// ============================================================
// EDUCATION PRICES
// ============================================================
const EDUCATION_PRICES = {
    '1': { name: 'WAEC', price: 5250, profit: 263 },
    '2': { name: 'NECO', price: 2250, profit: 113 },
    '3': { name: 'NABTEB', price: 900, profit: 45 },
};

// ============================================================
// ELECTRICITY PROVIDERS
// ============================================================
const ELECTRICITY_PROVIDERS = {
    '1': 'IKEDC', '2': 'EKEDC', '3': 'KEDCO', '4': 'PHED',
    '5': 'JED', '6': 'IBEDC', '7': 'KAEDCO', '8': 'AEDC',
    '9': 'EEDC', '10': 'BEDC'
};

// ============================================================
// TRANSACTIONS
// ============================================================
function getTransactions() {
    try { return JSON.parse(localStorage.getItem('paysbillz_transactions')) || []; }
    catch { return []; }
}

function saveTransactions(txs) {
    localStorage.setItem('paysbillz_transactions', JSON.stringify(txs));
}

function addTransaction(type, name, amount, detail = '', profit = 0) {
    const txs = getTransactions();
    txs.unshift({ id: Date.now(), type, name, amount, detail, profit, time: new Date().toLocaleString() });
    if (txs.length > 100) txs.pop();
    saveTransactions(txs);
    renderTransactions();
    updateTxCount();
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================
function renderTransactions() {
    const txs = getTransactions();
    const container = document.getElementById('transactionList');
    if (txs.length === 0) {
        container.innerHTML = `<div class="empty-transactions"><span class="emoji">🛒</span>No transactions yet.</div>`;
        return;
    }
    container.innerHTML = txs.map(tx => `
        <div class="transaction-item ${tx.type}">
            <div>
                <div class="transaction-name">${tx.name}</div>
                <div class="transaction-detail">${tx.detail || ''}</div>
            </div>
            <div style="text-align:right;">
                <div class="transaction-amount">₦${tx.amount.toLocaleString()}</div>
                ${tx.profit > 0 ? `<div class="profit-badge">+₦${tx.profit.toFixed(2)}</div>` : ''}
                <div class="transaction-time">${tx.time}</div>
            </div>
        </div>
    `).join('');
}

function updateTxCount() {
    const txs = getTransactions();
    document.getElementById('txCount').textContent = txs.length;
    document.getElementById('txnCount').textContent = txs.length;
}

// ============================================================
// RENDER PLANS
// ============================================================
function renderPlans(filter = 'all') {
    const grid = document.getElementById('plansGrid');
    let filtered = filter === 'all' ? allPlans : allPlans.filter(p => p.validity.toLowerCase() === filter);
    if (filtered.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">No ${filter} plans available.</div>`;
        return;
    }
    grid.innerHTML = filtered.map(p => `
        <div class="plan-card validity-${p.validity.toLowerCase()}">
            <div class="plan-top">
                <div class="plan-name">${p.name}<small>${p.network} · ${p.validity}</small></div>
                <span class="plan-badge ${p.validity.toLowerCase()}">${p.validity}</span>
            </div>
            <div class="plan-bottom">
                <span class="plan-price">₦${p.price.toLocaleString()}</span>
                <button class="buy-btn" onclick="buyDataPlan('${p.id}')">Buy</button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// BUY FUNCTIONS
// ============================================================
async function buyDataPlan(planId) {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) return;
    if (!confirm(`Confirm purchase: ${plan.name} - ₦${plan.price}?`)) return;
    showResult('loading', '⏳ Processing...');
    try {
        const res = await fetch(API + '/api/buy-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, plan: planId })
        });
        const data = await res.json();
        if (data.success) {
            const profit = data.result?.profit || plan.profit || 0;
            addTransaction('data', plan.name, plan.price, `📡 ${plan.network}`, profit);
            showToast(`✅ ${plan.name} purchased!`, 'success');
            closeModal();
            loadBalance();
        } else {
            showResult('error', '❌ ' + (data.error || 'Purchase failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

async function buyAirtime() {
    const network = document.getElementById('airtimeNetwork').value;
    const amount = document.getElementById('airtimeAmount').value.trim();
    const phone = document.getElementById('airtimePhone').value.trim();
    if (!amount || amount < 50) { showResult('error', '⚠️ Min ₦50'); return; }
    if (!phone || phone.length < 10) { showResult('error', '⚠️ Valid phone required'); return; }
    if (!confirm(`Buy ${network} airtime ₦${amount} for ${phone}?`)) return;
    showResult('loading', '⏳ Processing...');
    try {
        const res = await fetch(API + '/api/buy-airtime', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, amount: Number(amount) })
        });
        const data = await res.json();
        if (data.success) {
            const profit = data.result?.profit || Math.round(Number(amount) * 0.05);
            addTransaction('airtime', `${network} Airtime`, Number(amount), `📞 ${phone}`, profit);
            showToast(`✅ ₦${amount} airtime sent!`, 'success');
            closeModal();
            loadBalance();
        } else {
            showResult('error', '❌ ' + (data.error || 'Purchase failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

async function buyTV() {
    const serviceID = document.getElementById('tvService').value;
    const iucNum = document.getElementById('tvIuc').value.trim();
    const tvInfo = TV_PRICES[serviceID];
    if (!iucNum || iucNum.length < 4) { showResult('error', '⚠️ Valid Smart Card required'); return; }
    if (!confirm(`Subscribe to ${tvInfo.name} - ₦${tvInfo.price}?`)) return;
    showResult('loading', '⏳ Processing...');
    try {
        const res = await fetch(API + '/api/buy-tv', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, serviceID, iucNum })
        });
        const data = await res.json();
        if (data.success) {
            const profit = data.result?.profit || tvInfo.profit || 0;
            addTransaction('tv', tvInfo.name, tvInfo.price, `🆔 ${iucNum}`, profit);
            showToast(`✅ ${tvInfo.name} subscribed!`, 'success');
            closeModal();
            loadBalance();
        } else {
            showResult('error', '❌ ' + (data.error || 'Subscription failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

async function buyElectricity() {
    const serviceID = document.getElementById('elecService').value;
    const meterNum = document.getElementById('elecMeter').value.trim();
    const meterType = document.getElementById('elecType').value;
    const amount = document.getElementById('elecAmount').value.trim();
    const provider = ELECTRICITY_PROVIDERS[serviceID] || 'Unknown';
    if (!meterNum || meterNum.length < 4) { showResult('error', '⚠️ Valid meter required'); return; }
    if (!amount || amount < 100) { showResult('error', '⚠️ Min ₦100'); return; }
    if (!confirm(`Pay electricity ₦${amount} for ${provider}?`)) return;
    showResult('loading', '⏳ Processing...');
    try {
        const res = await fetch(API + '/api/buy-electricity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, serviceID, meterNum, meterType: Number(meterType), amount: Number(amount) })
        });
        const data = await res.json();
        if (data.success) {
            const profit = data.result?.profit || Math.round(Number(amount) * 0.02);
            addTransaction('electricity', `${provider} Electricity`, Number(amount), `🔢 ${meterNum}`, profit);
            showToast(`✅ Electricity payment successful!`, 'success');
            closeModal();
            loadBalance();
        } else {
            showResult('error', '❌ ' + (data.error || 'Payment failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

async function buyEducation() {
    const serviceID = document.getElementById('eduService').value;
    const quantity = document.getElementById('eduQuantity').value || 1;
    const eduInfo = EDUCATION_PRICES[serviceID];
    const totalPrice = eduInfo.price * quantity;
    if (!confirm(`Buy ${quantity}x ${eduInfo.name} pin(s) - ₦${totalPrice}?`)) return;
    showResult('loading', '⏳ Processing...');
    try {
        const res = await fetch(API + '/api/buy-education', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, serviceID, quantity: Number(quantity) })
        });
        const data = await res.json();
        if (data.success) {
            const profit = data.result?.profit || (eduInfo.profit * quantity);
            addTransaction('education', `${eduInfo.name} PIN`, totalPrice, `📦 ${quantity} pin(s)`, profit);
            showToast(`✅ ${eduInfo.name} pin(s) purchased!`, 'success');
            closeModal();
            loadBalance();
        } else {
            showResult('error', '❌ ' + (data.error || 'Purchase failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

// ============================================================
// REAL PAYSTACK FUNDING - UPDATED
// ============================================================
async function fundWithPaystack() {
    const email = document.getElementById('fundEmail').value.trim();
    const phone = document.getElementById('fundPhone').value.trim();
    const amount = document.getElementById('fundAmount').value.trim();
    
    // Validate
    if (!email || !email.includes('@')) {
        showResult('error', '⚠️ Please enter a valid email address');
        return;
    }
    if (!phone || phone.length < 10) {
        showResult('error', '⚠️ Please enter a valid phone number');
        return;
    }
    if (!amount || isNaN(amount) || Number(amount) < 100) {
        showResult('error', '⚠️ Amount must be at least ₦100');
        return;
    }
    
    if (!confirm(`✅ Confirm wallet funding:\n💰 ₦${amount}\n📧 ${email}\n📞 ${phone}\n\nProceed to Paystack?`)) return;
    
    showResult('loading', '⏳ Initializing payment with Paystack...');
    
    try {
        const res = await fetch(API + '/api/fund-wallet-paystack', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email, 
                phone: phone,
                amount: Number(amount)
            })
        });
        const data = await res.json();
        
        if (data.success) {
            showResult('success', '✅ Redirecting to Paystack...');
            // Open Paystack in new window
            window.open(data.authorization_url, '_blank');
            showToast(`✅ Payment initialized! Complete on Paystack.`, 'success');
            setTimeout(() => { 
                closeModal(); 
                // Check for payment status after a delay
                setTimeout(() => loadBalance(), 5000);
            }, 2000);
        } else {
            showResult('error', '❌ ' + (data.error || 'Payment initialization failed'));
        }
    } catch (err) {
        showResult('error', '❌ Connection error: ' + err.message);
    }
}

// ============================================================
// WITHDRAW PROFIT
// ============================================================
async function withdrawProfit() {
    const amount = document.getElementById('withdrawAmount').value.trim();
    const bank = document.getElementById('withdrawBank').value.trim();
    const account = document.getElementById('withdrawAccount').value.trim();
    const name = document.getElementById('withdrawName').value.trim();
    
    if (!amount || amount < 100) { showResult('error', '⚠️ Min ₦100'); return; }
    if (!bank || !account || !name) { showResult('error', '⚠️ All bank details required'); return; }
    if (!confirm(`Withdraw ₦${amount} to ${bank}?`)) return;
    showResult('loading', '⏳ Processing...');
    try {
        const res = await fetch(API + '/api/withdraw-profit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, amount: Number(amount), bankName: bank, accountNumber: account, accountName: name })
        });
        const data = await res.json();
        if (data.success) {
            addTransaction('withdrawal', 'Profit Withdrawal', Number(amount), `🏦 ${bank}`, 0);
            showToast(`✅ Withdrawal of ₦${amount} submitted!`, 'success');
            closeModal();
            loadBalance();
        } else {
            showResult('error', '❌ ' + (data.error || 'Withdrawal failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

// ============================================================
// KYC FUNCTIONS
// ============================================================
async function submitKYC() {
    const name = document.getElementById('kycName').value.trim();
    const email = document.getElementById('kycEmail').value.trim();
    const dob = document.getElementById('kycDob').value;
    const bvn = document.getElementById('kycBvn').value.trim();
    const nin = document.getElementById('kycNin').value.trim();
    const address = document.getElementById('kycAddress').value.trim();
    
    if (!name) { showResult('error', '⚠️ Full name required'); return; }
    if (!email || !email.includes('@')) { showResult('error', '⚠️ Valid email required'); return; }
    if (!address) { showResult('error', '⚠️ Address required'); return; }
    if (bvn && bvn.length !== 11) { showResult('error', '⚠️ BVN must be 11 digits'); return; }
    if (nin && nin.length !== 11) { showResult('error', '⚠️ NIN must be 11 digits'); return; }
    
    showResult('loading', '⏳ Submitting KYC...');
    try {
        const res = await fetch(API + '/api/kyc/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: userPhone, fullName: name, email, dateOfBirth: dob, bvn, nin, address })
        });
        const data = await res.json();
        if (data.success) {
            showToast(`✅ KYC submitted! Tier ${data.tier} activated.`, 'success');
            showResult('success', `✅ KYC submitted! You are now ${data.limits.name}. Daily limit: ₦${data.limits.dailyLimit.toLocaleString()}`);
            setTimeout(() => { loadKYCStatus(); loadBalance(); }, 1000);
        } else {
            showResult('error', '❌ ' + (data.error || 'KYC submission failed'));
        }
    } catch (err) {
        showResult('error', '❌ ' + err.message);
    }
}

async function loadKYCStatus() {
    try {
        const res = await fetch(API + '/api/kyc/status?phone=' + userPhone);
        const data = await res.json();
        if (data.success) {
            const kyc = data.kyc;
            document.getElementById('kycTierDisplay').textContent = `${kyc.tierName} (${kyc.tier})`;
            document.getElementById('kycStatusText').textContent = kyc.status;
            document.getElementById('kycStatusText').className = `status-badge ${kyc.status}`;
            document.getElementById('kycDailyLimitDisplay').textContent = `₦${kyc.dailyLimit.toLocaleString()}`;
            
            if (kyc.virtualAccount) {
                document.getElementById('virtualAccountDisplay').textContent = kyc.virtualAccount;
            }
            document.getElementById('bankNameDisplay').textContent = 'Paystack MFB';
        }
    } catch (err) {
        console.error('KYC status error:', err);
    }
}

// ============================================================
// FINGERPRINT LOGIN
// ============================================================
function setupFingerprint() {
    if (!window.PublicKeyCredential) {
        showToast('⚠️ Fingerprint not supported on this device', 'error');
        showResult('error', '⚠️ Fingerprint not supported on this device.');
        return;
    }
    
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(function(available) {
            if (!available) {
                showToast('⚠️ No fingerprint sensor detected.', 'error');
                showResult('error', '⚠️ No fingerprint sensor detected.');
                return false;
            }
            return true;
        })
        .then(function(available) {
            if (!available) return;
            
            showResult('loading', '🔐 Place your finger on the sensor...');
            
            const fingerprintId = 'FP_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            localStorage.setItem('fingerprintData', fingerprintId);
            localStorage.setItem('fingerprintRegistered', 'true');
            
            return fetch(API + '/api/fingerprint/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: userPhone, fingerprintData: fingerprintId })
            });
        })
        .then(function(response) {
            if (!response) return;
            return response.json();
        })
        .then(function(data) {
            if (data && data.success) {
                fingerprintRegistered = true;
                showToast('✅ Fingerprint registered successfully!', 'success');
                showResult('success', '✅ Fingerprint registered! You can now login with your fingerprint.');
            } else if (data) {
                showResult('error', '❌ ' + (data.error || 'Registration failed'));
            }
        })
        .catch(function(err) {
            showResult('error', '❌ ' + err.message);
        });
}

function loginWithFingerprint() {
    if (!window.PublicKeyCredential) {
        showToast('⚠️ Fingerprint not supported.', 'error');
        showResult('error', '⚠️ Fingerprint not supported.');
        return;
    }
    
    showResult('loading', '🔐 Scanning fingerprint... Please wait...');
    
    setTimeout(function() {
        const storedFingerprint = localStorage.getItem('fingerprintData');
        if (!storedFingerprint) {
            showResult('error', '❌ No fingerprint registered. Please register first.');
            return;
        }
        
        fetch(API + '/api/fingerprint/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprintData: storedFingerprint })
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
            if (data.success) {
                showToast('✅ Fingerprint login successful!', 'success');
                showResult('success', '✅ Welcome back, ' + data.user.name + '!');
                localStorage.setItem('userPhone', data.user.phone);
                localStorage.setItem('userName', data.user.name);
                setTimeout(function() { 
                    loadBalance(); 
                    closeModal(); 
                    window.location.reload();
                }, 1500);
            } else {
                showResult('error', '❌ ' + (data.error || 'Login failed'));
            }
        })
        .catch(function(err) {
            showResult('error', '❌ Connection error: ' + err.message);
        });
    }, 1500);
}

// ============================================================
// COPY ACCOUNT NUMBER
// ============================================================
function copyAccountNumber() {
    const accountNumber = document.getElementById('virtualAccountDisplay').textContent;
    if (accountNumber && accountNumber !== 'Loading...') {
        navigator.clipboard.writeText(accountNumber).then(function() {
            showToast('✅ Account number copied!', 'success');
        }).catch(function() {
            const input = document.createElement('input');
            input.value = accountNumber;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            showToast('✅ Account number copied!', 'success');
        });
    }
}

// ============================================================
// MODAL FUNCTIONS
// ============================================================
function openModal(type) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    const result = document.getElementById('resultMsg');
    result.className = 'result-msg';
    result.textContent = '';
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    const fundAccountNumber = document.getElementById('virtualAccountDisplay').textContent || 'Loading...';
    const fundAccountName = localStorage.getItem('userName') || 'Customer';
    
    const forms = {
        data: `
            <p style="color:var(--text-secondary);margin-bottom:12px;">Select a data plan:</p>
            <div id="modalPlansGrid" style="max-height:300px;overflow-y:auto;"></div>
        `,
        airtime: `
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Network</label>
            <select id="airtimeNetwork"><option value="MTN">MTN</option><option value="Airtel">Airtel</option><option value="GLO">GLO</option><option value="9mobile">9mobile</option></select>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Amount (₦)</label>
            <input type="number" id="airtimeAmount" placeholder="Min ₦50" min="50" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Phone Number</label>
            <input type="tel" id="airtimePhone" placeholder="080xxxxxxxx" />
            <button class="modal-btn" onclick="buyAirtime()">🚀 Purchase</button>
        `,
        tv: `
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">TV Package</label>
            <select id="tvService">${Object.entries(TV_PRICES).map(([id, info]) => `<option value="${id}">${info.name} - ₦${info.price.toLocaleString()}</option>`).join('')}</select>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Smart Card</label>
            <input type="text" id="tvIuc" placeholder="Enter Smart Card number" />
            <button class="modal-btn" onclick="buyTV()">📺 Subscribe</button>
        `,
        electricity: `
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Provider</label>
            <select id="elecService">${Object.entries(ELECTRICITY_PROVIDERS).map(([id, name]) => `<option value="${id}">${name}</option>`).join('')}</select>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Meter Number</label>
            <input type="text" id="elecMeter" placeholder="Enter meter number" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Meter Type</label>
            <select id="elecType"><option value="1">Prepaid</option><option value="2">Postpaid</option></select>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Amount (₦)</label>
            <input type="number" id="elecAmount" placeholder="Min ₦100" min="100" />
            <button class="modal-btn" onclick="buyElectricity()">💡 Pay</button>
        `,
        education: `
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Exam Type</label>
            <select id="eduService">${Object.entries(EDUCATION_PRICES).map(([id, info]) => `<option value="${id}">${info.name} - ₦${info.price.toLocaleString()}</option>`).join('')}</select>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Quantity</label>
            <input type="number" id="eduQuantity" value="1" min="1" />
            <button class="modal-btn" onclick="buyEducation()">📚 Buy</button>
        `,
        fund: `
            <h3 style="color:var(--gold);margin-bottom:12px;">💰 Fund Your Wallet</h3>
            
            <div style="background:rgba(255,215,0,0.05);border:1px solid rgba(255,215,0,0.15);border-radius:12px;padding:16px;margin-bottom:12px;">
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:8px;">Pay with Paystack (Card, Bank Transfer, USSD)</p>
                <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                    <span class="paystack-badge">✓ Secure</span>
                    <span class="paystack-badge">✓ Instant</span>
                    <span class="paystack-badge">✓ All Cards</span>
                </div>
            </div>
            
            <div class="paystack-info">
                <div class="step">
                    <span class="num">1</span>
                    <span>Enter your email and phone number</span>
                </div>
                <div class="step">
                    <span class="num">2</span>
                    <span>Enter the amount you want to fund</span>
                </div>
                <div class="step">
                    <span class="num">3</span>
                    <span>Click "Pay with Paystack"</span>
                </div>
                <div class="step">
                    <span class="num">4</span>
                    <span>Complete payment on Paystack (Card, Transfer, USSD)</span>
                </div>
                <div class="step">
                    <span class="num">5</span>
                    <span>Wallet is credited instantly after payment</span>
                </div>
            </div>
            
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Email Address *</label>
            <input type="email" id="fundEmail" placeholder="youremail@example.com" required />
            
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Phone Number *</label>
            <input type="tel" id="fundPhone" placeholder="08012345678" required />
            
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Amount (₦) *</label>
            <input type="number" id="fundAmount" placeholder="Enter amount (min ₦100)" min="100" required />
            
            <button class="modal-btn success" onclick="fundWithPaystack()" style="font-size:18px;">💳 Pay with Paystack</button>
            
            <p style="color:var(--text-muted);font-size:11px;margin-top:8px;text-align:center;">
                🔒 Secured by Paystack. Your card details are safe.
            </p>
        `,
        withdraw: `
            <p style="color:var(--text-secondary);margin-bottom:12px;font-size:13px;">Withdraw your profit balance.</p>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Amount (₦)</label>
            <input type="number" id="withdrawAmount" placeholder="Min ₦100" min="100" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Bank Name</label>
            <input type="text" id="withdrawBank" placeholder="e.g., GTBank" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Account Number</label>
            <input type="text" id="withdrawAccount" placeholder="Enter account number" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Account Name</label>
            <input type="text" id="withdrawName" placeholder="Full name" />
            <button class="modal-btn danger" onclick="withdrawProfit()">💸 Withdraw</button>
        `,
        kyc: `
            <p style="color:var(--text-secondary);margin-bottom:12px;font-size:13px;">Complete KYC to increase your limits.</p>
            <div style="background:var(--bg-card);padding:12px;border-radius:12px;margin-bottom:12px;border:1px solid var(--border-color);">
                <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-muted);">
                    <span>Current: <strong id="kycCurrentTier">Loading...</strong></span>
                    <span>Daily Limit: <strong id="kycCurrentLimit">₦0</strong></span>
                </div>
            </div>
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Full Name *</label>
            <input type="text" id="kycName" placeholder="Enter full name" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Email *</label>
            <input type="email" id="kycEmail" placeholder="youremail@example.com" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Date of Birth</label>
            <input type="date" id="kycDob" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">BVN (11 digits) *</label>
            <input type="password" id="kycBvn" placeholder="Enter 11-digit BVN" maxlength="11" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">NIN (11 digits) *</label>
            <input type="password" id="kycNin" placeholder="Enter 11-digit NIN" maxlength="11" />
            <label style="color:var(--text-secondary);font-size:13px;display:block;margin-top:8px;">Address *</label>
            <input type="text" id="kycAddress" placeholder="Enter residential address" />
            <button class="modal-btn" onclick="submitKYC()">🪪 Submit KYC</button>
        `,
        fingerprint: `
            <div style="text-align:center;padding:10px 0;">
                <div style="font-size:64px;margin-bottom:10px;">🔐</div>
                <h3 style="color:var(--text-primary);margin-bottom:8px;">Fingerprint Login</h3>
                <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Register your fingerprint for quick and secure login</p>
                <p style="color:var(--text-muted);font-size:12px;margin-bottom:16px;">⚠️ Place your finger on the sensor when prompted</p>
                
                <button class="fingerprint-btn" onclick="setupFingerprint()">
                    <span class="icon-large">📱</span> Register Fingerprint
                </button>
                
                <div style="margin-top:12px;text-align:center;color:var(--text-muted);font-size:12px;">
                    Already registered? <a style="color:var(--gold);cursor:pointer;font-weight:600;" onclick="loginWithFingerprint()">Login with fingerprint</a>
                </div>
            </div>
        `
    };
    
    const titles = {
        data: '📱 Buy Data',
        airtime: '📞 Buy Airtime',
        tv: '📺 TV Subscription',
        electricity: '💡 Pay Electricity',
        education: '📚 Buy Exam Pins',
        fund: '💰 Fund Wallet',
        withdraw: '💸 Withdraw Profit',
        kyc: '🪪 KYC Verification',
        fingerprint: '🔐 Fingerprint Login'
    };
    
    title.textContent = titles[type] || 'Service';
    body.innerHTML = forms[type] || '<p style="color:var(--text-muted);">Invalid option</p>';
    
    if (type === 'data') {
        renderModalPlans('all');
    }
    
    if (type === 'kyc') {
        loadKYCStatusForModal();
    }
}

function renderModalPlans(filter = 'all') {
    const container = document.getElementById('modalPlansGrid');
    if (!container) return;
    let filtered = filter === 'all' ? allPlans : allPlans.filter(p => p.validity.toLowerCase() === filter);
    if (filtered.length === 0) {
        container.innerHTML = `<div style="text-align:center;color:var(--text-muted);padding:20px;">No plans found</div>`;
        return;
    }
    container.innerHTML = filtered.map(p => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg-card);border-radius:12px;margin-bottom:6px;border:1px solid var(--border-color);">
            <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:13px;">${p.name}</div>
                <div style="font-size:11px;color:var(--text-muted);">${p.network} · ${p.validity}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-weight:700;color:var(--gold);font-size:14px;">₦${p.price.toLocaleString()}</span>
                <button class="buy-btn" onclick="buyDataPlan('${p.id}')" style="padding:4px 14px;font-size:11px;">Buy</button>
            </div>
        </div>
    `).join('');
}

async function loadKYCStatusForModal() {
    try {
        const res = await fetch(API + '/api/kyc/status?phone=' + userPhone);
        const data = await res.json();
        if (data.success) {
            document.getElementById('kycCurrentTier').textContent = data.kyc.tierName;
            document.getElementById('kycCurrentLimit').textContent = '₦' + data.kyc.dailyLimit.toLocaleString();
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

function showResult(type, message) {
    const result = document.getElementById('resultMsg');
    result.className = 'result-msg show ' + type;
    result.textContent = message;
}

// ============================================================
// LOAD BALANCE
// ============================================================
async function loadBalance() {
    try {
        const res = await fetch(API + '/api/profile?phone=' + userPhone);
        const data = await res.json();
        if (data.success) {
            const user = data.user;
            document.getElementById('balanceDisplay').textContent = '₦' + (user.balance || 0).toLocaleString();
            document.getElementById('profitDisplay').textContent = '₦' + (user.profitBalance || 0).toLocaleString();
            document.getElementById('phoneBadge').textContent = '📞 ' + user.phone;
            if (user.virtualAccount) {
                document.getElementById('virtualAccountDisplay').textContent = user.virtualAccount;
            }
            document.getElementById('bankNameDisplay').textContent = 'Paystack MFB';
            if (user.name) {
                localStorage.setItem('userName', user.name);
            }
        }
    } catch (err) {
        console.error('Balance load error:', err);
    }
}

// ============================================================
// TOAST NOTIFICATION
// ============================================================
let toastTimeout;

function showToast(message, type) {
    if (type === undefined) type = 'success';
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(function() { toast.classList.remove('show'); }, 4000);
}

// ============================================================
// THEME TOGGLE
// ============================================================
function toggleTheme() {
    const html = document.documentElement;
    const current = html.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('themeIcon').textContent = newTheme === 'light' ? '☀️' : '🌙';
    localStorage.setItem('paysbillz_theme', newTheme);
}

function loadTheme() {
    const saved = localStorage.getItem('paysbillz_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    document.getElementById('themeIcon').textContent = saved === 'light' ? '☀️' : '🌙';
}

// ============================================================
// LOGOUT
// ============================================================
function logout() {
    if (confirm('Logout from Paysbillz?')) {
        localStorage.clear();
        window.location.href = '/';
    }
}

// ============================================================
// CHECK PAYMENT STATUS ON LOAD
// ============================================================
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment');
    const reference = urlParams.get('reference');
    
    if (paymentSuccess === 'success' && reference) {
        showToast(`✅ Payment successful! Reference: ${reference}`, 'success');
        // Remove the query params from URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Refresh balance
        setTimeout(() => loadBalance(), 2000);
    }
}

// ============================================================
// INIT
// ============================================================
if (!localStorage.getItem('userPhone')) {
    window.location.href = '/';
}

loadTheme();
loadBalance();
loadKYCStatus();
renderPlans('all');
renderTransactions();
updateTxCount();
checkPaymentStatus();

// Check if fingerprint was previously registered
if (localStorage.getItem('fingerprintRegistered')) {
    fingerprintRegistered = true;
}

// Filter tabs
document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        this.classList.add('active');
        renderPlans(this.dataset.filter);
    });
});
</script>
</body>
</html>