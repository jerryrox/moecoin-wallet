import React from 'react';
import styled from 'styled-components';
import Shared from 'components/Shared';

const HeaderContainer = styled.div`
    background-color: #fff;
    height: 70px;
    width: 100%;
    flex: 80px;
    display: flex;
    flex-direction: row;
    align-items:center;
    ${Shared.BoxShadow}
`;

const Title = styled.div`
    height: 100%;
    width: 40%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: left;
`;

const TitleText = styled.h1`
    margin: auto;
    display:box;
    width: 100%;
    height: 100%;
    font-weight: 400;
    vertical-align: middle;
    margin-left: 20px;
    margin-top: 30px;
`;

const TopMenu = styled.div`
    width: 60%;
    height: 100%;
`;

const MenuList = styled.ul`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    padding-top: 5px;
    padding-right: 35px;
    box-sizing: border-box;
`;

const MenuItem = styled.li`
    padding-right: 15px;
`;

const MenuButton = styled.button`
    border: 1px solid #aae;
    background-color: #fff;
    height: 35px;
    width: 60px;

    &:hover {
        background-color: #88a;
    }
`;

const HeaderPresenter = ({isLoading, mineBlock, isMining}) => (
    <HeaderContainer>
        <Title>
            <TitleText>
                {isLoading ? "Loading..." : "Moecoin Wallet"}
            </TitleText>
        </Title>
        <TopMenu>
            <MenuList>
                <MenuItem>
                    <MenuButton onClick={mineBlock} disable={isMining}>
                        {isMining ? "Mining" : "Mine"}
                    </MenuButton>
                </MenuItem>
            </MenuList>
        </TopMenu>
    </HeaderContainer>
);

export default HeaderPresenter;
