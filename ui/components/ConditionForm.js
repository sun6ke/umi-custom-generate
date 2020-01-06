import {Button, Input, Form, Row, Col, Select} from 'antd';
import React, {createRef, useState} from 'react';
import { PlusCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

let id = 1;
export default class ConditionForm extends React.Component {

  state = {
    keys: [0]
  }

  formRef = createRef()

  types = [
    { value: 'DATEPICKER', name: '时间', placeholder: '请选择' },
    { value: 'RANGEPICKER', name: '时间范围', placeholder: '请选择' },
    { value: 'SELECT', name: '单选', placeholder: '请选择' },
    { value: 'MULSELECT', name: '多选', placeholder: '请选择（多选）' },
    { value: 'INPUT', name: '输入框', placeholder: '请输入' },
    { value: 'CHECKBOX', name: 'checkbox', placeholder: '' },
  ]

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

  handleChange = (value, key) => {
    let new_placeholder = this.types.find(type => type.value === value).placeholder;
    this.formRef.current.setFieldsValue({
      [`placeholders${key}`]: new_placeholder,
    });
  }

  getValues = () => {
    return this.formRef.current.validateFields().then(values => {

      const keys = this.state.keys;
      let formList = keys.map(key => {
        return {
          type: values[`types${key}`],
          label: values[`labels${key}`],
          field: values[`fields${key}`],
          placeholder: values[`placeholders${key}`]
        }
      })

      return formList
    })

  };

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
        <Col span={6}>
          <Form.Item
            label={index === 0 ? 'label' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`labels${k}`}
          >
            <Input placeholder="label" style={{ width: '60%', marginRight: 8 }} />
          </Form.Item>

        </Col>
        <Col span={6}>
          <Form.Item
            label={index === 0 ? 'type' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`types${k}`}
          >

            <Select style={{ width: '60%', marginRight: 8 }} onChange={(e) => this.handleChange(e, k)}>
              {
                this.types.map(type => (<Select.Option key={type.value} value={type.value}>{type.name}</Select.Option>))
              }
            </Select>
          </Form.Item>

        </Col>
        <Col span={6}>
          <Form.Item
            label={index === 0 ? 'field' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`fields${k}`}
          >
            <Input placeholder="field" style={{ width: '70%', marginRight: 8 }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item
            label={index === 0 ? 'placeholder' : ''}
            validateTrigger={['onChange', 'onBlur']}
            rules={[{required: true, whitespace: true, message: '请输入'}]}
            name={`placeholders${k}`}
          >
            <Input placeholder="输入框的placeholder" style={{ width: '70%', marginRight: 8 }} />
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
        layout={'vertical'}
        ref={this.formRef}
        initialValues={{
          labels0: '城市',
          types0: 'INPUT',
          fields0: 'city',
          placeholders0: '请输入'
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
