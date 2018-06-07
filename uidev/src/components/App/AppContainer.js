import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {injectGlobal} from 'styled-components';
import reset from 'styled-components';
import axios from 'axios';
import typography from '../../typography';
import {MASTER_NODE, SELF_NODE, SELF_P2P_NODE} from '../../constants';
import AppPresenter from './AppPresenter';

const baseStyles = () => injectGlobal`
    ${reset};
    ${typography};
    h1, h2, h3, h4 {
        margin-bottom: 0 !important;
    }
    body {
        overflow: hidden;
        margin: 0;
    }
    div {
        margin: 0;
    }
    ul {
        list-style: none;
    }
    ::-webkit-scrollbar {
        display: none;
    }
`;

class AppContainer extends Component {

    static propTypes = {
        sharedPort: PropTypes.number.isRequired
    };

    state = {
        isLoading: true,
        isMining: false,
        address: "",
        balance: 0,
        toAddress: ""
    };

    componentDidMount = () => {
        const port = this.props.sharedPort;

        this.registerOnMaster(port);
        this.getAddress(port);

        this.getBalance(port);
        setInterval(() => this.getBalance(port), 1000);
    };

    registerOnMaster = async(port) => {
        const request = await axios.post(`${MASTER_NODE}/peers`, {
            "peer": SELF_P2P_NODE(port)
        });
    };

    getAddress = async(port) => {
        const request = await axios.get(`${SELF_NODE(port)}/me/address`);
        this.setState({
            address: request.data,
            isLoading: false
        });
    };

    getBalance = async(port) => {
        const request = await axios.get(`${SELF_NODE(port)}/me/balance`);
        const {balance} = request.data;
        this.setState({
            balance: balance
        });
    };

    mineBlock = async() => {
        const { sharedPort } = this.props;
        this.setState({
            isMining: true
        });
        const request = await axios.post(`${SELF_NODE(sharedPort)}/blocks`);
        this.setState({
            isMining: false
        }, () => {
            alert("Successfully mined block.");
        });
    }

    handleInput = (e) => {
        const { target: {name, value} } = e;
        this.setState({
            [name]: value
        });
    };

    handleSubmit = async(e) => {
        e.preventDefault();
        const { sharedPort } = this.props;
        const {amount, toAddress, balance} = this.state;

        if(amount > balance) {
            alert("You don't have enough balance.");
            return;
        }

        const request = await axios.post(`${SELF_NODE(sharedPort)}/transactions`, {
            amount: Number(amount),
            address: toAddress
        });
        this.setState({
            amount: 0,
            toAddress: ""
        });
    };

	render() {
        baseStyles();
        console.log("Balance: " + this.state.balance)
		return (
            <AppPresenter
                {...this.state}
                mineBlock={this.mineBlock}
                handleInput={this.handleInput}
                handleSubmit={this.handleSubmit}
            />
		);
	}
}


export default AppContainer;
