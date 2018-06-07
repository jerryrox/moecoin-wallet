import React from 'react';
import styled from 'styled-components';
import Shared from 'components/Shared';

const InfoContainer = styled.div`
    width: 100%;
    height: 200px;
    margin-top: 20px;
    background-color: #fff;
    flex: flex-grow;
    display:flex;
    flex-direction: column;
    ${Shared.BoxShadow}
`;

const Section = styled.section`
    flex: 1;
    padding: 0 40px;
    box-sizing: border-box;

    &:first-child {
        padding-top: 20px;
        margin-bottom: 20px;
    }
`;

const SectionTitle = styled.h2`
    font-size: 20px;
`;

const SectionContent = styled.p`
    display: block;
    margin: 10px auto 0 auto;
    width: 90%;
`;

const InfoPresenter = ({isLoading, address, balance}) => (
    <InfoContainer>
        <Section>
            <SectionTitle>Address</SectionTitle>
            <SectionContent>
                {address}
            </SectionContent>
        </Section>
        <Section>
            <SectionTitle>Balance</SectionTitle>
            <SectionContent>
                {balance} MOE
            </SectionContent>
        </Section>
    </InfoContainer>
);

export default InfoPresenter;