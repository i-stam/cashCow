pragma solidity ^0.7.1;

import {ISuperToken, IConstantFlowAgreementV1, ISuperfluid} from "./RedirectAll.sol";

contract CFALibrary {
    ISuperfluid private _host; // host
    IConstantFlowAgreementV1 private _cfa; // the stored constant flow agreement class address
    ISuperToken private _acceptedToken; // accepted token

    constructor(
        ISuperfluid host,
        IConstantFlowAgreementV1 cfa,
        ISuperToken acceptedToken
    ) {
        require(address(host) != address(0), "host is zero address");
        require(address(cfa) != address(0), "cfa is zero address");
        require(address(acceptedToken) != address(0), "acceptedToken is zero address");

        _host = host;
        _cfa = cfa;
        _acceptedToken = acceptedToken;
    }

    /**************************************************************************
     * Library
     *************************************************************************/
    function _createFlow(address to, int96 flowRate) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x"
        );
    }

    function _createFlow(
        address to,
        int96 flowRate,
        bytes ctx
    ) internal returns (bytes newCtx) {
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.createFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x",
            ctx
        );
    }

    function _updateFlow(address to, int96 flowRate) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x"
        );
    }

    function _updateFlow(
        address to,
        int96 flowRate,
        bytes ctx
    ) internal returns (bytes newCtx) {
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.updateFlow.selector,
                _acceptedToken,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x",
            ctx
        );
    }

    function _deleteFlow(address from, address to) internal {
        _host.callAgreement(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                from,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x"
        );
    }

    function _deleteFlow(
        address from,
        address to,
        bytes ctx
    ) internal returns (bytes newCtx) {
        (newCtx, ) = _host.callAgreementWithContext(
            _cfa,
            abi.encodeWithSelector(
                _cfa.deleteFlow.selector,
                _acceptedToken,
                from,
                to,
                flowRate,
                new bytes(0) // placeholder
            ),
            "0x",
            ctx
        );
    }
}
