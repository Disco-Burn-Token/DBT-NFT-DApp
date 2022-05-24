//import * as helper from './w3Helper.js';

const serverUrl = "https://bd6xpqfykho5.usemoralis.com:2053/server"; //Server url from moralis.io
const appId = "s9hVE8SmoSVGqcdEyp6eQhQmbFBVXxmvoMLPEaAU"; // Application id from moralis.io

//This is being used to hold the Web3API namespace
let token_obj;

//keeps track of if a user is logged in.
let logged_in;

var nftMintCount = 0;

var intervalId = window.setInterval(function() {
    remainingNFT();
}, 60000);

//Called when site is loading.
async function init() {
    await Moralis.start({ serverUrl, appId });
    await Moralis.enableWeb3();

    token_obj = await Moralis.Web3API.token;
    currentUser = await Moralis.User.current();
    global.user_profile.entity = currentUser;
    //If User is logged in
    if (currentUser) {
        logged_in = true;
        document.getElementById("login_button").innerText = "Logout";
        userAddress = currentUser.get('ethAddress');
        document.getElementById("current-wallet").innerText = "0x..." + userAddress.slice(38);
        setHelperData();
        console.log(global.user_profile.born);
        document.getElementById("logged_in_info").style.display = "block";
        loading();
        getBNBBalance();
        getNFTAmounts();
        remainingNFT();
        document.getElementById("vote_token_1_button").removeAttribute("title")
    }

    //If user is not logged in
    else {
        logged_in = false;
        document.getElementById("login_button").innerText = "Sign in with MetaMask";
        document.getElementById("logged_in_info").style.display = "none";
        document.getElementById("vote_token_1_button").disabled = true;
    }
}

async function setHelperData() {
    global.user_profile.born = JSON.stringify(currentUser.createdAt);
    const options = { chain: 'bsc' }
    global.user_profile.balances = await Moralis.Web3API.account.getTokenBalances(options);
    global.user_profile.native_bal = await Moralis.Web3API.account.getNativeBalance(options);
}

async function login() {
    try {
        currentUser = Moralis.User.current();
        if (!currentUser) {
            document.getElementById("login_button").innerText = "Authenticating...";
            currentUser = await Moralis.authenticate();
            userAddress = currentUser.get('ethAddress');
            document.getElementById("current-wallet").innerText = "0x..." + userAddress.slice(38);
            loading();
            getBNBBalance();
            getNFTAmounts();
            setHelperData();
            remainingNFT();
            document.getElementById("vote_token_1_button").disabled = false;
            document.getElementById("vote_token_1_button").removeAttribute("title");
        } else {
            logOut();
        }
        document.getElementById("login_button").innerText = "Logout";
        document.getElementById("logged_in_info").style.display = "block";
        logged_in = true;
    } catch (error) {
        if (error.message == "MetaMask Message Signature: User denied message signature.") {
            alert("Login cancelled")
            document.getElementById("login_button").innerText = "Sign in with Metamask";
        }
    }
}
async function logOut() {
    currentUser = await Moralis.User.logOut();
    document.getElementById("login_button").innerText = "Sign in with Metamask";
    document.getElementById("message").style.display = "none";
    document.getElementById("logged_in_info").style.display = "none";
    document.getElementById("vote_token_1_button").disabled = true;
    clearAmounts();
    logged_in = false;
}

async function loginWC() {
    try {
        currentUser = Moralis.User.current();
        if (!currentUser) {
            document.getElementById("login_button_wc").innerText = "Authenticating...";
            currentUser = await Moralis.authenticate({ provider: "walletconnect", chainId: 56 });
            userAddress = currentUser.get('ethAddress');
            document.getElementById("current-wallet").innerText = "0x..." + userAddress.slice(38);
            loading();
            getBNBBalance();
            getNFTAmounts();
            remainingNFT();
            document.getElementById("vote_token_1_button").disabled = false;
            document.getElementById("vote_token_1_button").removeAttribute("title");
        } else {
            logOutWC();
        }
        document.getElementById("login_button_wc").innerText = "Logout";
        document.getElementById("logged_in_info").style.display = "block";
        logged_in = true;
    } catch (error) {
        if (error.message == "User closed modal") {
            alert("Login cancelled")
            document.getElementById("login_button_wc").innerText = "Sign in with WalletConnect";
        }
    }
}

async function logOutWC() {
    currentUser = await Moralis.User.logOut();
    document.getElementById("login_button_wc").innerText = "Sign in with WalletConnect";
    document.getElementById("message").style.display = "none";
    document.getElementById("logged_in_info").style.display = "none";
    document.getElementById("vote_token_1_button").disabled = true;
    clearAmounts();
    logged_in = false;
}

function setNFTCount() {
    var nftCount = document.getElementById("vote-count-input1");
    nftCountValue = nftCount.value;
    nftMintCount = parseInt(nftCountValue);
    document.getElementById("estimated-cost").innerText = (nftMintCount * .05).toFixed(2) + " BNB + " + "Gas";
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function mintNFT() {
    try {
        if (nftMintCount * .05 > bnbBalance) {
            document.getElementById("view-tx").style.fontWeight = 600;
            document.getElementById("view-tx").style.color = '#4a0d0d';
            document.getElementById("view-tx").innerText = "Insufficent BNB Balance";
            return;
        }
        if (nftMintCount == 0) {
            document.getElementById("view-tx").style.fontWeight = 600;
            document.getElementById("view-tx").style.color = '#4a0d0d';
            document.getElementById("view-tx").innerText = "Please enter an amount";
            return;
        } else {
            const options = {
                contractAddress: "0xFB024c47abf992CC41Ac8D45c0b9BfB2493Ff779",
                functionName: "purchase",
                abi: ABI,
                params: {
                    _amount: nftMintCount
                },
                msgValue: Moralis.Units.ETH(nftMintCount * .05),
            };
            loading();
            const transaction = await Moralis.executeFunction(options);
            const receipt = await transaction;
            console.log(receipt);
            txhash = receipt.transactionHash;
            txHistory();
            getBNBBalance();
            getNFTAmounts();
            remainingNFT();
        }
    } catch (error) {
        if (error.code == 4001) {
            document.getElementById("view-tx").style.fontWeight = 600;
            document.getElementById("view-tx").style.color = '#4a0d0d';
            document.getElementById("view-tx").innerText = "Transcation rejected in wallet";
            getBNBBalance();
            getNFTAmounts();
            remainingNFT();
        }
    }
}

async function getBNBBalance() {
    const options2 = {
        chain: "bsc",
    };
    const balance = await Moralis.Web3API.account.getNativeBalance(options2);
    bnbBalanceValue = (balance.balance / 10 ** 18);
    bnbBalance = bnbBalanceValue;
    document.getElementById("dvt-balance-current").innerText = bnbBalance.toFixed(6);
}

function txHistory() {
    var url = "https://bscscan.com/tx/";
    var tId = txhash;
    document.getElementById("view-tx").innerHTML = "Success! <a href='" + url + tId + "' class='txhistory' target='_blank'>" + "View Last Transaction" + "</a> ";
}

let slideIndex = 0;
showSlides();

function showSlides() {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    slideIndex++;
    if (slideIndex > slides.length) { slideIndex = 1 }
    slides[slideIndex - 1].style.display = "block";
    setTimeout(showSlides, 9000); // Change image every 8 seconds
}

async function getNFTAmounts() {

    let nftBalances = await await Moralis.Web3API.account.getNFTs({ chain: "bsc" });

    nftBalancesFilter = nftBalances.result.filter(function(e) {
        return e.token_address == 0xda88ce3f3c71d084de14a611cf47df8af47269b0;
    });

    let token1Check = nftBalancesFilter.filter(function(f) {
        return f.token_id == 1;
    });

    let token2Check = nftBalancesFilter.filter(function(g) {
        return g.token_id == 2;
    });

    let token3Check = nftBalancesFilter.filter(function(h) {
        return h.token_id == 3;
    });

    let token4Check = nftBalancesFilter.filter(function(i) {
        return i.token_id == 4;
    });

    if (token1Check.length >= 1) {
        document.getElementById("nftamount1").innerText = (token1Check[0].amount);
    } else {
        document.getElementById("nftamount1").innerText = "0";
    };
    if (token2Check.length >= 1) {
        document.getElementById("nftamount2").innerText = (token2Check[0].amount);
    } else {
        document.getElementById("nftamount2").innerText = "0";
    };
    if (token3Check.length >= 1) {
        document.getElementById("nftamount3").innerText = (token3Check[0].amount);
    } else {
        document.getElementById("nftamount3").innerText = "0";
    };
    if (token4Check.length >= 1) {
        document.getElementById("nftamount4").innerText = (token4Check[0].amount);
    } else {
        document.getElementById("nftamount4").innerText = "0";
    };

};

async function remainingNFT() {

    const options5 = {
        chain: "bsc",
        address: "0xFB024c47abf992CC41Ac8D45c0b9BfB2493Ff779",
        function_name: "totalSupply",
        abi: ABI,
    };

    const nftRemain = await Moralis.Web3API.native.runContractFunction(options5);
    document.getElementById("remainingNFT").innerText = nftRemain;
}

function clearAmounts() {
    document.getElementById("nftamount1").innerText = "Sign in to view";
    document.getElementById("nftamount2").innerText = "Sign in to view";
    document.getElementById("nftamount3").innerText = "Sign in to view";
    document.getElementById("nftamount4").innerText = "Sign in to view";
};

function loading() {
    document.getElementById("nftamount1").innerHTML = "<img src=\"https://discoburntoken.com/wp-content/uploads/2022/04/Rolling-1s-25px-1.svg\">";
    document.getElementById("nftamount2").innerHTML = "<img src=\"https://discoburntoken.com/wp-content/uploads/2022/04/Rolling-1s-25px-1.svg\">";
    document.getElementById("nftamount3").innerHTML = "<img src=\"https://discoburntoken.com/wp-content/uploads/2022/04/Rolling-1s-25px-1.svg\">";
    document.getElementById("nftamount4").innerHTML = "<img src=\"https://discoburntoken.com/wp-content/uploads/2022/04/Rolling-1s-25px-1.svg\">";
    document.getElementById("dvt-balance-current").innerHTML = "<img src=\"https://discoburntoken.com/wp-content/uploads/2022/04/Rolling-1s-25px-1.svg\">";
    document.getElementById("remainingNFT").innerHTML = "<img src=\"https://discoburntoken.com/wp-content/uploads/2022/04/Rolling-1s-25px-1.svg\">";
};

const ABI = [{ "inputs": [{ "internalType": "address", "name": "_dbtNFT", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Paused", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "indexed": true, "internalType": "bytes32", "name": "previousAdminRole", "type": "bytes32" }, { "indexed": true, "internalType": "bytes32", "name": "newAdminRole", "type": "bytes32" }], "name": "RoleAdminChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": true, "internalType": "address", "name": "sender", "type": "address" }], "name": "RoleGranted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "account", "type": "address" }, { "indexed": true, "internalType": "address", "name": "sender", "type": "address" }], "name": "RoleRevoked", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "address", "name": "account", "type": "address" }], "name": "Unpaused", "type": "event" }, { "inputs": [], "name": "DEFAULT_ADMIN_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "MAX_FEE", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "SUPPLIER_ROLE", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "dbtNFT", "outputs": [{ "internalType": "contract IERC1155", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "devPercent", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "devWallet", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getAllTokens", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }], "name": "getRoleAdmin", "outputs": [{ "internalType": "bytes32", "name": "", "type": "bytes32" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "grantRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "hasRole", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256[]", "name": "", "type": "uint256[]" }, { "internalType": "uint256[]", "name": "", "type": "uint256[]" }, { "internalType": "bytes", "name": "", "type": "bytes" }], "name": "onERC1155BatchReceived", "outputs": [{ "internalType": "bytes4", "name": "", "type": "bytes4" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "bytes", "name": "", "type": "bytes" }], "name": "onERC1155Received", "outputs": [{ "internalType": "bytes4", "name": "", "type": "bytes4" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "onetimeLimit", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "ownerWallet", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "pause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "paused", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "price", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "purchase", "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "purchased", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "renounceRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes32", "name": "role", "type": "bytes32" }, { "internalType": "address", "name": "account", "type": "address" }], "name": "revokeRole", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_percent", "type": "uint256" }], "name": "setDevPercent", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_limit", "type": "uint256" }], "name": "setOnetimeLimit", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_price", "type": "uint256" }], "name": "setPrice", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_account", "type": "address" }, { "internalType": "bool", "name": "_flag", "type": "bool" }], "name": "setSupplier", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "address", "name": "_dev", "type": "address" }], "name": "setWallets", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "supplies", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "supply", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "unpause", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "stateMutability": "payable", "type": "receive" }]


init();
remainingNFT();

document.getElementById("login_button").onclick = login;
document.getElementById("login_button_wc").onclick = loginWC;
document.getElementById("vote_token_1_button").onclick = mintNFT;
document.getElementById("vote-count-input1").oninput = setNFTCount;