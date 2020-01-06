import {Button, Input, Form, Icon, Row, Col, Select} from 'antd';
import React, {createRef, useState} from 'react';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

let id = 1;
class TableForm extends React.Component {

  state = {
    keys: [0]
  }

  formRef1 = createRef();
  widthUnit = {};

  remove = k => {
    const keys = this.state.keys;
    // We need at least one passenger
    if (keys.length === 1) {
      return;
    }

    // can use data-binding to set
    this.setState({
      keys: keys.filter(key => key !== k),
    });
  };

  add = () => {
    const keys = this.state.keys;
    console.log(keys);
    const nextKeys = keys.concat(id++);
    this.setState({keys: nextKeys})
  };

  getValues = () => {
    return this.formRef1.current.validateFields().then(values => {
      const keys = this.state.keys;

      let columnList = keys.map(key => {
        return {
          title: values[`titles${key}`],
          dataIndex: values[`dataIndexes${key}`],
          width: values[`widths${key}`] + (this.widthUnit[key] ? this.widthUnit[key] : '%')
        }
      })

      return columnList

    })

  };

  handleAfterChange = (value, key) => {
    this.widthUnit[key] = value;
  }

  render() {
    const formItemLayoutWithOutLabel = {
      wrapperCol: {
        xs: { span: 24, offset: 0 },
        sm: { span: 20, offset: 4 },
      },
    };


    const keys = this.state.keys;
    const formItems = keys.map((k, index) => (
      <Row key={k}>
        <Col span={8}>
          <Form.Item
            label={index === 0 ? 'title' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`titles${k}`}
          >
            <Input placeholder="title" style={{ width: '60%', marginRight: 8 }} />
          </Form.Item>

        </Col>
        <Col span={8}>
          <Form.Item
            label={index === 0 ? 'dataIndex' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`dataIndexes${k}`}
          >
            <Input placeholder="dataIndex" style={{ width: '70%', marginRight: 8 }} />
          </Form.Item>

        </Col>
        <Col span={8}>
          <Form.Item
            label={index === 0 ? 'width' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`widths${k}`}
          >
            <Input placeholder="width" style={{ width: '70%', marginRight: 8 }} addonAfter={
              <Select defaultValue="%" style={{ width: 60 }} onChange={(e) => this.handleAfterChange(e, k)}>
                <Select.Option value="%">%</Select.Option>
                <Select.Option value="px">px</Select.Option>
              </Select>
            } />
          </Form.Item>
          {keys.length > 1 ? (
            <MinusCircleOutlined
              style={{fontSize: 20, position: 'absolute', right: 5, top: index===0?35:5}}
              className="dynamic-delete-button"
              onClick={() => this.remove(k)}/>
          ) : null}
        </Col>
      </Row>
    ));

    return (
      <Form
        ref={this.formRef1}
        layout={'vertical'}
        initialValues={{
          titles0: '编号',
          dataIndexes0: 'id',
          widths0: '100'
        }}
      >
        {formItems}
        <Form.Item {...formItemLayoutWithOutLabel}>
          <Button type="dashed" onClick={this.add} style={{ width: '80%' }}>
            <PlusCircleOutlined style={{fontSize: 18}} />添加条件
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default TableForm;
