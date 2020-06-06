import { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { Button, Layout } from 'antd';

const { Header, Content, Footer } = Layout;

export default function Home() {
  const [result, setResult] = useState(null);
  return (
    <Layout>
      <Head>
        <title>Tools for Asset Management</title>
      </Head>

      <Layout>
        <Header>Header</Header>
        <Content style={{ margin: '14px' }}>
          <Link href={`${process.env.BASE_URL}/planner`}>
            <a>投資計画計算</a>
          </Link>
        </Content>
        <Footer>Footer</Footer>
      </Layout>
    </Layout>
  );
}
