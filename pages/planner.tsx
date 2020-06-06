import { useState } from 'react';
import Head from 'next/head';
import { Table, Button, Layout, Input, Select, DatePicker, Form } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import moment from 'moment';

import {
  Asset,
  EIKind,
  TermKind,
  Term,
  EI,
  Params,
  MonthAsset,
  run,
  Monthly,
  Yearly,
  Extraordinary,
} from '../lib/planner';

const { Header, Content, Footer } = Layout;
const { RangePicker } = DatePicker;
const { Option } = Select;

const columns = [
  {
    title: '年月',
    dataIndex: 'month',
    key: 'month',
  },
  {
    title: '収入',
    dataIndex: 'income',
    key: 'income',
  },
  {
    title: '支出',
    dataIndex: 'expense',
    key: 'expense',
  },
  {
    title: '現金',
    dataIndex: 'cash',
    key: 'cash',
  },
  {
    title: 'リスク資産',
    dataIndex: 'risk',
    key: 'risk',
  },
];

export default function Home() {
  console.log('rebuild');
  // form
  const initStart = moment();
  const initEnd = moment().add(10, 'year');
  const [range, setRange] = useState([initStart, initEnd]);
  const [expectedReturn, setExpectedReturn] = useState(1);
  const [expectedMaxDrawdown, setExpectedMaxDrawdown] = useState(0.5);
  const [eis, setEis] = useState([
    {
      eiKind: 'income',
      termKind: 'monthly',
      term: {
        startYear: initStart.year(),
        startMonth: initStart.month() + 1,
        endYear: initEnd.year(),
        endMonth: initEnd.month() + 1,
      },
      amount: 30,
      title: 'salary',
    },
    {
      eiKind: 'expense',
      termKind: 'monthly',
      term: {
        startYear: initStart.year(),
        startMonth: initStart.month() + 1,
        endYear: initEnd.year(),
        endMonth: initEnd.month() + 1,
      },
      amount: 20,
      title: 'monthly expense',
    },
  ] as EI[]);
  const onEIKindChange = (eiKind: EIKind, i: number) => {
    eis[i].eiKind = eiKind;
    setEis([...eis]);
  };
  const onTermKindChange = (termKind: TermKind, i: number) => {
    eis[i].termKind = termKind;
    switch (termKind) {
      case 'monthly':
        eis[i].term = {
          startYear: range[0].year(),
          startMonth: range[0].month() + 1,
          endYear: range[1].year(),
          endMonth: range[1].month() + 1,
        };
        break;
      case 'yearly':
        eis[i].term = {
          startYear: range[0].year(),
          endYear: range[1].year(),
          month: range[0].month() + 1,
        };
        break;
      case 'extraordinary':
        eis[i].term = {
          year: range[0].year(),
          month: range[0].month() + 1,
        };
        break;
    }
    setEis([...eis]);
  };
  const onTermChange = (term: Term, i: number) => {
    eis[i].term = term;
    setEis([...eis]);
  };
  const onAmountChange = (amount: number, i: number) => {
    eis[i].amount = amount;
    setEis([...eis]);
  };
  const onTitleChange = (title: string, i: number) => {
    eis[i].title = title;
    setEis([...eis]);
  };
  const onRemoveEI = (i: number) => {
    eis.splice(i, 1);
    console.log(eis);
    setEis([...eis]);
  };
  const onAddEI = () => {
    eis.push({
      eiKind: 'expense',
      termKind: 'monthly',
      term: {
        startYear: range[0].year(),
        startMonth: range[0].month() + 1,
        endYear: range[1].year(),
        endMonth: range[1].month() + 1,
      },
      amount: 0,
      title: '',
    });
    setEis([...eis]);
  };
  const [initialCash, setInitialCash] = useState(0);
  const [initialRisk, setInitialRisk] = useState(0);

  // params
  const params: Params = {
    startYear: range[0].year(),
    startMonth: range[0].month() + 1,
    endYear: range[1].year(),
    endMonth: range[1].month() + 1,
    expectedReturn: expectedReturn,
    expectedMaxDrawdown: expectedMaxDrawdown,
    eis: eis,
    initialAsset: {
      cash: initialCash,
      risk: initialRisk,
    },
  };

  // result
  const [history, setHistory] = useState([]);
  const dataSource = history.map((ma, i) => ({
    key: i,
    month: `${ma.monthInfo.year}年${ma.monthInfo.month}月`,
    income: ma.monthInfo.income,
    expense: ma.monthInfo.expense,
    cash: ma.asset.cash,
    risk: ma.asset.risk,
  }));
  const onChange = (e, i) => console.log(e, i);
  return (
    <Layout>
      <Head>
        <title>Tools for Asset Management</title>
      </Head>

      <Layout>
        <Header>Header</Header>
        <Content style={{ margin: '14px' }}>
          <>
            <Form.Item label="開始月・終了月">
              <RangePicker
                value={range as any}
                onChange={setRange}
                picker="month"
              />
            </Form.Item>
            <Form.Item label="支出・収入">
              {eis.map((ei, i) => {
                let term = <></>;
                const amount = (
                  <Input
                    value={ei.amount}
                    type="number"
                    onChange={(e) =>
                      onAmountChange(parseInt(e.target.value), i)
                    }
                  />
                );
                const title = (
                  <Input
                    value={ei.title}
                    onChange={(e) => onTitleChange(e.target.value, i)}
                  />
                );
                const remove = <Button onClick={() => onRemoveEI(i)}>x</Button>;
                switch (ei.termKind) {
                  case 'monthly':
                    const tm = ei.term as Monthly;
                    term = (
                      <>
                        <RangePicker
                          value={[
                            moment()
                              .year(tm.startYear)
                              .month(tm.startMonth - 1),
                            moment()
                              .year(tm.endYear)
                              .month(tm.endMonth - 1),
                          ]}
                          onChange={(r) =>
                            onTermChange(
                              {
                                startYear: r[0].year(),
                                startMonth: r[0].month() + 1,
                                endYear: r[1].year(),
                                endMonth: r[1].month() + 1,
                              },
                              i,
                            )
                          }
                          picker="month"
                        />
                        {amount}
                        {title}
                        {remove}
                      </>
                    );
                    break;
                  case 'yearly':
                    const ty = ei.term as Yearly;
                    term = (
                      <>
                        <RangePicker
                          value={[
                            moment().year(ty.startYear),
                            moment().year(ty.endYear),
                          ]}
                          onChange={(r) =>
                            onTermChange(
                              {
                                startYear: r[0].year(),
                                endYear: r[1].year(),
                                month: ty.month,
                              },
                              i,
                            )
                          }
                          picker="year"
                        />
                        <Input
                          value={ty.month}
                          type="number"
                          onChange={(e) =>
                            onTermChange(
                              {
                                startYear: ty.startYear,
                                endYear: ty.endYear,
                                month: parseInt(e.target.value),
                              },
                              i,
                            )
                          }
                        />
                        {amount}
                        {title}
                        {remove}
                      </>
                    );
                    break;
                  case 'extraordinary':
                    const te = ei.term as Extraordinary;
                    term = (
                      <>
                        <Input
                          value={te.year}
                          type="number"
                          onChange={(e) =>
                            onTermChange(
                              {
                                year: parseInt(e.target.value),
                                month: te.month,
                              },
                              i,
                            )
                          }
                        />
                        <Input
                          value={te.month}
                          type="number"
                          onChange={(e) =>
                            onTermChange(
                              {
                                year: te.year,
                                month: parseInt(e.target.value),
                              },
                              i,
                            )
                          }
                        />
                        {amount}
                        {title}
                        {remove}
                      </>
                    );
                    break;
                }
                return (
                  <div key={i}>
                    <Select
                      value={ei.eiKind}
                      onChange={(k, _) => onEIKindChange(k, i)}
                    >
                      <Option value="income">収入</Option>
                      <Option value="expense">支出</Option>
                    </Select>
                    <Select
                      value={ei.termKind}
                      onChange={(k, _) => onTermKindChange(k, i)}
                    >
                      <Option value="monthly">月次</Option>
                      <Option value="yearly">年次</Option>
                      <Option value="extraordinary">臨時</Option>
                    </Select>
                    {term}
                  </div>
                );
              })}
              <Button onClick={() => onAddEI()}>
                <PlusOutlined /> 収入・支出を追加
              </Button>
            </Form.Item>
            <Form.Item label="リスク資産の期待リターン">
              <Input
                value={expectedReturn}
                type="number"
                onChange={(e) => setExpectedReturn(parseFloat(e.target.value))}
              />
            </Form.Item>
            <Form.Item label="リスク資産の想定最大ドローダウン">
              <Input
                value={expectedMaxDrawdown}
                type="number"
                onChange={(e) =>
                  setExpectedMaxDrawdown(parseFloat(e.target.value))
                }
              />
            </Form.Item>
            <Form.Item label="初期資産">
              <Input
                value={initialCash}
                type="number"
                onChange={(e) => setInitialCash(parseInt(e.target.value))}
              />
              <Input
                value={initialRisk}
                type="number"
                onChange={(e) => setInitialRisk(parseInt(e.target.value))}
              />
            </Form.Item>
            <Button type="primary" onClick={() => setHistory(run(params))}>
              計算開始
            </Button>
          </>
          {history === [] ? (
            <></>
          ) : (
            <Table
              pagination={{ defaultPageSize: 12 * 5 }}
              dataSource={dataSource}
              columns={columns}
            />
          )}
        </Content>
        <Footer>Footer</Footer>
      </Layout>
    </Layout>
  );
}
