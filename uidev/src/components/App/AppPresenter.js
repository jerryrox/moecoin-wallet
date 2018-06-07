import React from 'react';
import styled from 'styled-components';
import Header from 'components/Header';
import Info from 'components/Info';
import Send from 'components/Send';

const MainContainer = styled.div`
    width: 100vw;
    height: 100vh;
    background-color: #eee;
    overflow: hidden;
`;

const MainWrapper = styled.div`
    width: 100%;
    height: 100%;
    padding: 20px;
    box-sizing: border-box;
`;

const AppPresenter = ({
        isLoading, balance, address, mineBlock, isMining, handleSubmit, handleInput, amount, toAddress
    }) => {

    return (
        <MainContainer>
            <MainWrapper>
                <Header mineBlock={mineBlock} isMining={isMining} />
                <Info balance={balance} isLoading={isLoading} address={address} />
                <Send handleSubmit={handleSubmit} handleInput={handleInput} amount={amount} toAddress={toAddress}/>
            </MainWrapper>
        </MainContainer>
    );
};

export default AppPresenter;