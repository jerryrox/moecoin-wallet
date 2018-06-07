import React from 'react';
import styled from 'styled-components';
import Shared from 'components/Shared';

const SendContainer = styled.div`
    width: 100%;
    height: 120px;
    margin-top: 20px;
    background-color: #fff;
    flex: flex-grow;
    display:flex;
    flex-direction: column;
    ${Shared.BoxShadow}
`;

const Section = styled.section`
    padding: 20px 40px;
`;

const SectionTitle = styled.h2`
    font-size: 20px;
`;

const InputGroup = styled.div`
    margin-top: 15px;
`;

const Input = styled.input`
    border: 2px solid #333;
    height: 40px;
    width: 200px;
    border-radius: 2px;
    padding: 10px;
    margin-right: 10px;
`;

const Submit = styled.button`
    background-color: #fff;
    border: 2px solid #333;
    height: 40px;
    width: 100px;
    border-radius: 2px;
    padding: 10px;
    margin-right: 10px;

    &:hover {
        background-color: #ccc;
    }
    &:disabled {
        background-color: #aaa;
    }
`;

const isSubmittable = (amount, toAddress) => {
    if(toAddress === undefined || toAddress === null || toAddress.length === 0)
        return false;
    if(amount === undefined || amount == null || amount <= 0)
        return false;
    return true;
};

const SendPresenter = ({handleInput, handleSubmit, amount, toAddress}) => (
    <SendContainer>
        <Section>
            <SectionTitle>Send MOE</SectionTitle>
            <InputGroup>
                <Input name="toAddress" placeholder="Address" value={toAddress} onInput={handleInput} />
                <Input name="amount" type="number" placeholder="Amount" value={amount} onInput={handleInput} />
                <Submit disabled={!isSubmittable(amount, toAddress)} onClick={handleSubmit}>
                    Send
                </Submit>
            </InputGroup>
        </Section>
    </SendContainer>
);

export default SendPresenter;