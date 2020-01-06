import React, {createRef, useEffect, useState} from 'react';
import {Button, Card, Form, Input, Switch, message, Select} from 'antd';
import ConditionForm from "./components/ConditionForm";
import TableForm from "./components/TableForm";
import classnames from 'classnames';
import styles from "./index.module.less"

class DynamicFieldSet extends React.Component {

  state = {
  }

  conditionForm = createRef();
  tableForm = createRef();
  forRef = createRef();

  handleSubmit = async (e) => {
    e.preventDefault();
    let payload = await this.forRef.current.validateFields();
    let formList = await this.conditionForm.current.getValues();
    let columnList = await this.tableForm.current.getValues();

    payload = {
      ...payload,
      formList,
      columnList
    }
    console.log(payload)

    const { callRemote } = this.props;
    const hide = message.loading('正在生成..', 0);
    const response = await callRemote({ type: 'org..umi-pro.generate', payload }).catch(err => {
      message.error(err.error)
    });
    hide();
  };

  render() {
    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 10 },
      },
    };

    const { projects } = this.props;

    return (
      <>
        <div className={classnames(styles.configContent)}>
          <Card title="基础配置">
            <Form
              {...formItemLayout}
              ref={this.forRef}
              initialValues={{className: 'Test', namespace: 'test', rowKey: 'id', pageTitle: '测试页面', showBack: false}}
            >
              <Form.Item
                label="选择项目"
                name="project"
                rules={[{required: true, message: '请选择项目'}]}
              >
                <Select>
                  {
                    projects.map(pro => (<Select.Option key={pro.name} value={pro.path}>{pro.path}</Select.Option>))
                  }
                </Select>
              </Form.Item>
              <Form.Item
                label="类名"
                name="className"
                rules={[{required: true, message: '请填写类名'}]}
              >
                <Input placeholder="类名"/>
              </Form.Item>
              <Form.Item
                label="namespace"
                name="namespace"
                rules={[{required: true, message: '请填写namespace'}]}
              >
                <Input placeholder="model里的namespace"/>
              </Form.Item>
              <Form.Item
                label="rowKey"
                name="rowKey"
                rules={[{required: true, message: '请填写类名'}]}
              >
                <Input placeholder="table的rowKey"/>
              </Form.Item>
              <Form.Item
                label="页面标题"
                name="pageTitle"
                rules={[{required: true, message: '请填写pageTitle'}]}
              >
                <Input placeholder="页面标题"/>
              </Form.Item>
              <Form.Item
                label="页面是否有返回按钮"
                name="showBack"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Form>
          </Card>

          <Card title="查询条件配置" style={{marginTop: 10}}>
            <ConditionForm ref={this.conditionForm}/>
          </Card>

          <Card title="表格配置" style={{marginTop: 10}}>
            <TableForm ref={this.tableForm}/>
          </Card>
        </div>

        <div className={styles.footerBtn}>
          <Button type="primary" onClick={this.handleSubmit}>提交</Button>
        </div>
      </>
    );
  }
}

export default (api) => {
  const { callRemote } = api;

  function PluginPanel() {

    let [projects, setProjects] = useState([]);

    useEffect(async () => {
      const { data } = await callRemote({
        type: 'org..umi-pro.products'
      });

      setProjects(data);
    }, [])

    return (
      <div style={{ height: '100%' }}>
        {/*<Button*/}
        {/*  type="primary"*/}
        {/*  onClick={async () => {*/}
        {/*    const { data } = await callRemote({*/}
        {/*      type: 'org..umi-pro.test',*/}
        {/*    });*/}
        {/*    alert(data);*/}
        {/*  }}*/}
        {/*>Test</Button>*/}
        <DynamicFieldSet projects={projects} callRemote={callRemote}/>
      </div>
    );
  }

  api.addPanel({
    title: 'umi-pro',
    path: '/umi-pro',
    icon: 'home',
    component: PluginPanel,
  });
}
