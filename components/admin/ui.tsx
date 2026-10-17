"use client";

import { useMemo, useState } from "react";

/* ---------- status pill ---------- */

export function Pill({ status }: { status: string }) {
	const cls = `gw-status gw-status--${status.toLowerCase().replace(/\s+/g, "-")}`;
	return <span className={cls}>{status}</span>;
}

/* ---------- sub tabs ---------- */

export function SubTabs({ tabs, active, onChange, counts }: {
	tabs: string[];
	active: string;
	onChange: (t: string) => void;
	counts?: Record<string, number>;
}) {
	return (
		<div className="gw-subtabs">
			{tabs.map((t) => (
				<button
					key={t}
					className={t === active ? "is-active" : ""}
					aria-pressed={t === active}
					onClick={() => onChange(t)}
				>
					{t}{counts?.[t] !== undefined ? ` (${counts[t]})` : ""}
				</button>
			))}
		</div>
	);
}

/* ---------- searchable / sortable / paginated table ---------- */

export interface Col<T> {
	key: string;
	label: string;
	render: (row: T) => React.ReactNode;
	sortKey?: (row: T) => string | number;
}

export function Table<T extends object>({
	cols,
	rows,
	pageSize = 8,
	empty = "Nothing to show.",
	onRow,
}: {
	cols: Col<T>[];
	rows: T[];
	pageSize?: number;
	empty?: string;
	onRow?: (row: T) => void;
}) {
	const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
	const [page, setPage] = useState(0);

	const sorted = useMemo(() => {
		if (!sort) return rows;
		const col = cols.find((c) => c.key === sort.key);
		if (!col?.sortKey) return rows;
		return rows.slice().sort((a, b) => {
			const x = col.sortKey!(a), y = col.sortKey!(b);
			if (x < y) return -1 * sort.dir;
			if (x > y) return 1 * sort.dir;
			return 0;
		});
	}, [rows, sort, cols]);

	const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
	const cur = Math.min(page, pages - 1);
	const slice = sorted.slice(cur * pageSize, cur * pageSize + pageSize);

	const toggle = (key: string) =>
		setSort((s) => (s?.key === key && s.dir === 1 ? { key, dir: -1 } : { key, dir: 1 }));

	return (
		<>
			<div className="gw-table-wrap">
				<table className="gw-table">
					<thead>
						<tr>
							{cols.map((c) => (
								<th
									key={c.key}
									onClick={() => c.sortKey && toggle(c.key)}
									style={c.sortKey ? { cursor: "pointer", userSelect: "none" } : undefined}
									aria-sort={sort?.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : undefined}
								>
									{c.label}
									{c.sortKey && (
										<span className="gw-sort-icn">
											{sort?.key === c.key ? (sort.dir === 1 ? " ▲" : " ▼") : " ↕"}
										</span>
									)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{slice.map((r, i) => (
							<tr key={i} onClick={onRow ? () => onRow(r) : undefined} style={onRow ? { cursor: "pointer" } : undefined}>
								{cols.map((c) => (
									<td key={c.key}>{c.render(r)}</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{slice.length === 0 && <div className="gw-empty" style={{ padding: "2rem" }}>{empty}</div>}
			{pages > 1 && (
				<div className="gw-pager">
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" disabled={cur === 0} onClick={() => setPage(cur - 1)}>
						← Prev
					</button>
					<span className="gw-small">Page {cur + 1} of {pages} · {sorted.length} rows</span>
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark gw-btn--small" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>
						Next →
					</button>
				</div>
			)}
		</>
	);
}

/* ---------- search input ---------- */

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
	return (
		<input
			type="search"
			className="gw-adminsearch"
			placeholder={placeholder ?? "Search…"}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			aria-label="Search"
		/>
	);
}

/* ---------- confirm dialog ---------- */

export function Confirm({ title, body, onOk, onCancel, okLabel }: {
	title: string;
	body: string;
	okLabel?: string;
	onOk: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="gw-modal-back" role="dialog" aria-modal="true" aria-label={title} onClick={onCancel}>
			<div className="gw-modal" onClick={(e) => e.stopPropagation()}>
				<h3 style={{ marginTop: 0 }}>{title}</h3>
				<p>{body}</p>
				<div className="gw-buttons">
					<button className="gw-btn gw-btn--gold" onClick={onOk} autoFocus>{okLabel ?? "Confirm"}</button>
					<button className="gw-btn gw-btn--outline gw-btn--outline-dark" onClick={onCancel}>Cancel</button>
				</div>
			</div>
		</div>
	);
}

/* ---------- slide-over drawer ---------- */

export function Drawer({ title, onClose, children, wide }: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	wide?: boolean;
}) {
	return (
		<div className="gw-modal-back" onClick={onClose}>
			<aside
				className={`gw-drawer${wide ? " gw-drawer--wide" : ""}`}
				role="dialog"
				aria-modal="true"
				aria-label={title}
				onClick={(e) => e.stopPropagation()}
			>
				<div className="gw-drawer__head">
					<h3 style={{ margin: 0 }}>{title}</h3>
					<button className="gw-drawer__close" onClick={onClose} aria-label="Close">✕</button>
				</div>
				<div className="gw-drawer__body">{children}</div>
			</aside>
		</div>
	);
}

/* ---------- detail row ---------- */

export function Dr({ k, v }: { k: string; v: React.ReactNode }) {
	return (
		<div className="gw-dr">
			<span>{k}</span>
			<strong>{v}</strong>
		</div>
	);
}

/* ---------- mini bar chart ---------- */

export function Bars({ data, h = 140 }: { data: { label: string; value: number }[]; h?: number }) {
	const max = Math.max(...data.map((d) => d.value), 1);
	return (
		<div className="gw-bars" role="img" aria-label="Bar chart">
			{data.map((d) => (
				<div className="gw-bars__col" key={d.label}>
					<span className="gw-bars__val">{d.value}</span>
					<span className="gw-bars__bar" style={{ height: `${(d.value / max) * h}px` }} />
					<span className="gw-bars__lbl">{d.label}</span>
				</div>
			))}
		</div>
	);
}

/* ---------- horizontal share bars ---------- */

export function Shares({ data }: { data: { label: string; pct: number }[] }) {
	return (
		<div className="gw-shares">
			{data.map((d) => (
				<div className="gw-shares__row" key={d.label}>
					<span className="gw-shares__lbl">{d.label}</span>
					<span className="gw-shares__track"><span style={{ width: `${d.pct}%` }} /></span>
					<span className="gw-shares__pct">{d.pct}%</span>
				</div>
			))}
		</div>
	);
}

/* ---------- section wrapper ---------- */

export function Panel({ title, sub, children, actions }: {
	title: string;
	sub?: string;
	children: React.ReactNode;
	actions?: React.ReactNode;
}) {
	return (
		<section className="gw-panel">
			<header className="gw-panel__head">
				<div>
					<h2>{title}</h2>
					{sub && <p>{sub}</p>}
				</div>
				{actions && <div className="gw-panel__actions">{actions}</div>}
			</header>
			{children}
		</section>
	);
}

export function fmtR(n: number) {
	return `R${n.toLocaleString("en-ZA").replace(/,/g, " ")}`;
}
