export type Asset = {
  cash: number;
  risk: number;
};

export type EIKind = 'expense' | 'income';

export type TermKind = 'monthly' | 'yearly' | 'extraordinary';

export type Monthly = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
};

export type Yearly = {
  startYear: number;
  endYear: number;
  month: number;
};

export type Extraordinary = {
  year: number;
  month: number;
};

export type Term = Monthly | Yearly | Extraordinary;

// Expense or Income
export type EI = {
  eiKind: EIKind;
  termKind: TermKind;
  term: Term;
  amount: number;
  title: string;
};

export type Params = {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
  eis: EI[];
  expectedReturn: number;
  expectedMaxDrawdown: number;
  initialAsset: Asset;
};

export type MonthInfo = {
  year: number;
  month: number;
  income: number;
  expense: number;
};

type MonthInfoHistory = MonthInfo[];

export type MonthAsset = {
  monthInfo: MonthInfo;
  asset: Asset; // after spending / buy / sell
};

export type MonthAssetHistory = MonthAsset[];

const toHistory = (params: Params): MonthInfoHistory => {
  let year = params.startYear;
  let month = params.startMonth;
  const history = [];
  while (
    year < params.endYear ||
    (year === params.endYear && month <= params.endMonth)
  ) {
    let income = 0;
    let expense = 0;
    params.eis.forEach((ei) => {
      let amount = 0;
      switch (ei.termKind) {
        case 'monthly':
          const tm = ei.term as Monthly;
          if (
            (tm.startYear < year ||
              (tm.startYear === year && tm.startMonth <= month)) &&
            (year < tm.endYear || (tm.endYear === year && month <= tm.endMonth))
          ) {
            amount = ei.amount;
          }
          break;
        case 'yearly':
          const ty = ei.term as Yearly;
          if (
            ty.startYear <= year &&
            year <= ty.endYear &&
            ty.month === month
          ) {
            amount = ei.amount;
          }
          break;
        case 'extraordinary':
          const te = ei.term as Extraordinary;
          if (te.year === year && te.month === month) {
            amount = ei.amount;
          }
          break;
      }

      switch (ei.eiKind) {
        case 'income':
          income += amount;
          break;
        case 'expense':
          expense += amount;
          break;
      }
    });

    history.push({
      year: year,
      month: month,
      income: income,
      expense: expense,
    });
    // update
    if (month === 12) {
      year++;
      month = 1;
    } else {
      month++;
    }
  }
  return history;
};

// すべて現金で保持し、最後まで到達できるかチェック
const checkAllCash = (
  initialAsset: Asset,
  history: MonthInfoHistory,
): boolean => {
  const asset = { ...initialAsset };
  let ok = true;
  history.forEach((info) => {
    asset.cash += info.income;
    asset.cash -= info.expense;
    if (asset.cash < 0) {
      ok = false;
    }
  });
  return ok;
};

const runWithMoveToRisk = (
  initialAsset: Asset,
  expectedMonthlyReturn: number,
  history: MonthInfoHistory,
): MonthAssetHistory => {
  // 逆順でやっていく
  history.reverse(); // ここで破壊するけどしょうがない
  const assetHistory = [];
  let mustCash = 0; // 月の最後にはこの額の現金が必要
  history.forEach((info) => {
    // mustCash 分の現金は次月に残しておかないといけない
    // 余るようであればリスク資産を買っていい
    const current = {
      cash: mustCash,
      risk: info.income - info.expense - mustCash,
    };
    // リセット
    mustCash = 0;
    // 現金が足りなかったら前月に残す現金を増やす
    if (current.risk < 0) {
      mustCash = current.risk * -1;
      current.risk = 0;
    }
    assetHistory.push({
      monthInfo: info,
      asset: current,
    });
  });
  assetHistory.reverse();
  // リスク資産を総和していく
  // 初月とすり合わせる。余ったらイニシャルのリスク資産へ
  let risk = initialAsset.risk + initialAsset.cash - mustCash;
  assetHistory.forEach((ma) => {
    ma.asset.risk += risk * expectedMonthlyReturn;
    risk = ma.asset.risk;
  });
  return assetHistory;
};

// 全部現金で持ちつつ一部売って確保
const runWithSellRisk = (
  initialAsset: Asset,
  expectedMonthlyReturn: number,
  expectedMaxDrawdown: number,
  history: MonthInfoHistory,
): MonthAssetHistory => {
  const assetHistory = [];
  const asset = { ...initialAsset };
  let bankruptcy = false;
  history.forEach((info) => {
    if (bankruptcy) {
      return;
    }
    asset.risk *= expectedMonthlyReturn;
    asset.cash += info.income - info.expense;
    if (asset.cash < 0) {
      // ドローダウン破産チェック
      if (asset.risk * expectedMaxDrawdown + asset.cash < 0) {
        bankruptcy = true;
        assetHistory.push({
          monthInfo: info,
          asset: { ...asset },
        });
        return;
      }
      asset.risk += asset.cash;
      asset.cash = 0;
    }
    // 最後に push
    assetHistory.push({
      monthInfo: info,
      asset: { ...asset },
    });
  });
  return assetHistory;
};

export const run = (params: Params): MonthAssetHistory => {
  const history = toHistory(params);
  const allCashOk = checkAllCash(params.initialAsset, history);
  const expectedMonthlyReturn = params.expectedReturn ** (1 / 12);
  if (allCashOk) {
    // 余剰資金をリスク資産に
    return runWithMoveToRisk(
      params.initialAsset,
      expectedMonthlyReturn,
      history,
    );
  } else {
    // 足りなくなったら都度リスク資産を売却していく
    return runWithSellRisk(
      params.initialAsset,
      expectedMonthlyReturn,
      params.expectedMaxDrawdown,
      history,
    );
  }
};
