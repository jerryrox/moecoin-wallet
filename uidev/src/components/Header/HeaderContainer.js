import React from 'react';
import HeaderPresenter from './HeaderPresenter';

export default class HeaderContainer extends React.Component {
    
    render() {
        return(
            <HeaderPresenter {...this.props} />
        );
    }
}
