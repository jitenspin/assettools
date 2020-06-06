import { run, EIKind, TermKind } from '../../lib/planner';

const baseParams = {
  startYear: 2020,
  startMonth: 1,
  endYear: 2020,
  endMonth: 1,
  eis: [],
  expectedReturn: 1,
  expectedMaxDrawdown: 0.5,
  initialAsset: {
    cash: 0,
    risk: 0,
  },
};

test('base', () => {
  const params = { ...baseParams };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 0,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 0,
      },
    },
  ]);
});

test('simple income', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'income' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 1,
        },
        amount: 10,
        title: '',
      },
    ],
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 10,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 10,
      },
    },
  ]);
});

test('simple expense', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'expense' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 1,
        },
        amount: 10,
        title: '',
      },
    ],
    initialAsset: {
      cash: 10,
      risk: 0,
    },
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 0,
        expense: 10,
      },
      asset: {
        cash: 0,
        risk: 0,
      },
    },
  ]);
});

test('yearly income', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'income' as EIKind,
        termKind: 'yearly' as TermKind,
        term: {
          startYear: 2020,
          endYear: 2020,
          month: 1,
        },
        amount: 10,
        title: '',
      },
    ],
    endMonth: 2,
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 10,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 10,
      },
    },
    {
      monthInfo: {
        year: 2020,
        month: 2,
        income: 0,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 10,
      },
    },
  ]);
});

test('extraordinary income', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'income' as EIKind,
        termKind: 'extraordinary' as TermKind,
        term: {
          year: 2020,
          month: 1,
        },
        amount: 10,
        title: '',
      },
    ],
    endMonth: 2,
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 10,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 10,
      },
    },
    {
      monthInfo: {
        year: 2020,
        month: 2,
        income: 0,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 10,
      },
    },
  ]);
});

test('income/expense', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'income' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 1,
        },
        amount: 10,
        title: '',
      },
      {
        eiKind: 'expense' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 1,
        },
        amount: 10,
        title: '',
      },
    ],
    initialAsset: {
      cash: 0,
      risk: 0,
    },
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 10,
        expense: 10,
      },
      asset: {
        cash: 0,
        risk: 0,
      },
    },
  ]);
});

test('bankruptcy', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'expense' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 1,
        },
        amount: 10,
        title: '',
      },
    ],
    initialAsset: {
      cash: 0,
      risk: 0,
    },
  };
  expect(run(params)).toEqual({
    monthInfo: {
      year: 2020,
      month: 1,
      income: 0,
      expense: 10,
    },
    asset: {
      cash: -10,
      risk: 0,
    },
  });
});

test('sell', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'expense' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 1,
        },
        amount: 10,
        title: '',
      },
    ],
    initialAsset: {
      cash: 0,
      risk: 100,
    },
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 0,
        expense: 10,
      },
      asset: {
        cash: 0,
        risk: 90,
      },
    },
  ]);
});

test('return', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'income' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 2,
        },
        amount: 10,
        title: '',
      },
    ],
    endMonth: 2,
    expectedReturn: 2 ** 12, // 月利2倍
    initialAsset: {
      cash: 0,
      risk: 100,
    },
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 10,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 210,
      },
    },
    {
      monthInfo: {
        year: 2020,
        month: 2,
        income: 10,
        expense: 0,
      },
      asset: {
        cash: 0,
        risk: 430,
      },
    },
  ]);
});

test('sell return', () => {
  const params = {
    ...baseParams,
    eis: [
      {
        eiKind: 'expense' as EIKind,
        termKind: 'monthly' as TermKind,
        term: {
          startYear: 2020,
          startMonth: 1,
          endYear: 2020,
          endMonth: 2,
        },
        amount: 10,
        title: '',
      },
    ],
    endMonth: 2,
    expectedReturn: 2 ** 12, // 月利2倍
    initialAsset: {
      cash: 0,
      risk: 100,
    },
  };
  expect(run(params)).toEqual([
    {
      monthInfo: {
        year: 2020,
        month: 1,
        income: 0,
        expense: 10,
      },
      asset: {
        cash: 0,
        risk: 190,
      },
    },
    {
      monthInfo: {
        year: 2020,
        month: 2,
        income: 0,
        expense: 10,
      },
      asset: {
        cash: 0,
        risk: 370,
      },
    },
  ]);
});
