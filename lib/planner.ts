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
  expectedReturn: number,
  history: MonthInfoHistory,
): MonthAssetHistory => {
  // 逆順でやっていく
  history.reverse(); // ここで破壊するけどしょうがない
  const assetHistory = [];
  const asset = {
    cash: 0,
    risk: 0, // ここのリスク資産は、この月に足されるという意味になる
  };
  history.forEach((info) => {
    console.log(info);
    // 逆順なので先に push
    assetHistory.push({
      monthInfo: info,
      asset: { ...asset },
    });
    // 前月の準備
    asset.cash += info.expense - info.income;
    asset.risk = 0;
    if (asset.cash < 0) {
      asset.risk = asset.cash * -1;
      asset.cash = 0;
    }
  });
  // 初月とすり合わせる。余ったらイニシャルのリスク資産へ
  const ini = { ...initialAsset };
  if (initialAsset.cash - asset.cash > 0) {
    ini.risk += initialAsset.cash - asset.cash;
    ini.cash = asset.cash;
  }
  assetHistory.push({
    // TODO: monthInfo
    monthInfo: {
      year: 2020,
      month: 4,
      income: 0,
      expense: 0,
    },
    asset: ini,
  });
  assetHistory.reverse();
  // リスク資産を総和していく
  let risk = 0;
  assetHistory.forEach((ma) => {
    risk += ma.asset.risk;
    ma.asset.risk = risk * expectedReturn;
  });
  return assetHistory;
};

// 全部現金で持ちつつ一部売って確保
const runWithSellRisk = (
  initialAsset: Asset,
  expectedReturn: number,
  expectedMaxDrawdown: number,
  history: MonthInfoHistory,
): MonthAssetHistory => {
  const assetHistory = [];
  const asset = { ...initialAsset };
  assetHistory.push({
    // TODO: monthInfo
    monthInfo: {
      year: 2020,
      month: 4,
      income: 0,
      expense: 0,
    },
    asset: asset,
  });
  history.forEach((info) => {
    asset.risk *= expectedReturn;
    asset.cash += info.income - info.expense;
    if (asset.cash < 0) {
      // TODO: ドローダウン破産チェック
      asset.risk += asset.cash;
      if (asset.risk < 0) {
        console.log('破産');
      }
    }
    // 最後に push
    assetHistory.push({
      monthInfo: info,
      asset: { ...asset },
    });
  });
  return assetHistory;
};

export const run = (params: Params) => {
  const history = toHistory(params);
  console.log(history);
  const allCashOk = checkAllCash(params.initialAsset, history);
  console.log(allCashOk);
  if (allCashOk) {
    // 余剰資金をリスク資産に
    return runWithMoveToRisk(
      params.initialAsset,
      params.expectedReturn,
      history,
    );
  } else {
    // 足りなくなったら都度リスク資産を売却していく
    return runWithSellRisk(
      params.initialAsset,
      params.expectedReturn,
      params.expectedMaxDrawdown,
      history,
    );
  }
};
