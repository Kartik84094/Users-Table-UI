import React, { useEffect, useState } from 'react';
import 'antd/dist/antd.css';
import '../index.css';
import { Form, InputNumber, Popconfirm, Table, Typography, Input, Button } from 'antd';
import axios from 'axios';
import differenceBy from 'lodash/differenceBy';
import { EditTwoTone, DeleteTwoTone } from '@ant-design/icons';

const EditableCell = ({
    editing,
    dataIndex,
    title,
    inputType,
    record,
    index,
    children,
    ...restProps
}) => {
    const inputNode = inputType === 'number' ? <InputNumber /> : <Input />;
    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item
                    name={dataIndex}
                    style={{
                        margin: 0,
                    }}
                    rules={[
                        {
                            required: true,
                            message: `Please Input ${title}!`,
                        },
                    ]}
                >
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const Users = () => {

    const [data, setData] = useState();
    const [form] = Form.useForm();
    const [editingKey, setEditingKey] = useState('');
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterText, setFilterText] = useState('');

    useEffect(() => {
        async function fetchData() {
            await axios.get('https://geektrust.s3-ap-southeast-1.amazonaws.com/adminui-problem/members.json')
                .then(res => {
                    res.data.forEach((element, i) => {
                        res.data[i]['key'] = i;
                    });
                    console.log(res.data);
                    setData(res.data)
                })
        }
        fetchData()
    }, [setData])

    const filteredItems = data?.filter(
        item => item.name && item.name.toLowerCase().includes(filterText.toLowerCase()) ||
            item.email && item.email.toLowerCase().includes(filterText.toLowerCase()) ||
            item.role && item.role.toLowerCase().includes(filterText.toLowerCase())
    );

    const start = () => {
        setLoading(true); // ajax request after empty completing
        const selectedRows = data.filter(i => selectedRowKeys.includes(i.key));
        setData(differenceBy(data, selectedRows, 'key'));
        setTimeout(() => {
            setSelectedRowKeys([]);
            setLoading(false);
        }, 1000);
    };

    const isEditing = (record) => record.key === editingKey;

    const edit = (record) => {
        form.setFieldsValue({
            name: '',
            age: '',
            address: '',
            ...record,
        });
        setEditingKey(record.key);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const handleDelete = (key) => {
        const newData = data.filter((item) => item.key !== key);
        setData(newData);
    };

    const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = [...data];
            const index = newData.findIndex((item) => key === item.key);

            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, { ...item, ...row });
                setData(newData);
                setEditingKey('');
            } else {
                newData.push(row);
                setData(newData);
                setEditingKey('');
            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            width: '25%',
            editable: true,
        },
        {
            title: 'Role',
            dataIndex: 'role',
            width: '15%',
            editable: true,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            width: '40%',
            editable: true,
        },
        {
            title: 'Actions',
            dataIndex: 'operation',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <span>
                        <Typography.Link
                            onClick={() => save(record.key)}
                            style={{
                                marginRight: 8,
                            }}
                        >
                            Save
                        </Typography.Link>
                        <Popconfirm title="Sure to cancel?" onConfirm={cancel}>
                            <a>Cancel</a>
                        </Popconfirm>
                    </span>
                ) : (
                    <div>
                        <Typography.Link disabled={editingKey !== ''} onClick={() => edit(record)}>
                            <EditTwoTone />
                        </Typography.Link>
                        <span
                            style={{
                                marginLeft: 20,
                            }}
                        >
                            <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}>
                                <DeleteTwoTone />
                            </Popconfirm></span></div>
                );
            },
        },
    ];

    const onSelectChange = (newSelectedRowKeys) => {
        console.log('selectedRowKeys changed: ', selectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };
    const hasSelected = selectedRowKeys.length > 0;
    const mergedColumns = columns.map((col) => {
        if (!col.editable) {
            return col;
        }

        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'age' ? 'number' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
            }),
        };
    });

    return (
        <div>
            <div
                style={{
                    marginBottom: 16,
                }}
            ><Popconfirm title="Sure to delete?" onConfirm={() => start()} >
                    <Button type="danger" disabled={!hasSelected} loading={loading}>
                        Delete
                    </Button>
                </Popconfirm>

                <span
                    style={{
                        marginLeft: 8,
                    }}
                >
                    {hasSelected ? `Selected ${selectedRowKeys.length} items` : ''}
                </span>
            </div>
            <div>
                <Input type='text' placeholder='Search by name, role or email' value={filterText} onChange={e => setFilterText(e.target.value)}></Input>
            </div>
            <Form form={form} component={false}>
                <Table
                    components={{
                        body: {
                            cell: EditableCell,
                        },
                    }}
                    bordered
                    dataSource={filteredItems}
                    columns={mergedColumns}
                    rowClassName="editable-row"
                    pagination={{
                        onChange: cancel,
                    }}
                    rowSelection={rowSelection}
                />
            </Form>
        </div>
    );
};

export default Users;