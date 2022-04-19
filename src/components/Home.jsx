import React, { useState } from 'react'
import { ethers } from 'ethers'

import poolabi from '../abis/Pool.json'
import daiabi from '../abis/DaiToken.json'
import './Home.css'

const Home = () => {
  const [errorMessage, setErrorMessage] = useState(null)
  const [defaultAccount, setDefaultAccount] = useState(null)
  const [userBalance, setUserBalance] = useState(null)
  const [connButtonText, setConnButtonText] = useState('Connect Wallet')
  const [depositor, setDepositor] = useState(null)
  const [borrower, setBorrower] = useState(null)
  const [loans, setLoans] = useState([])
  const poolContractAddress = process.env.REACT_APP_POOL_CONTRACT_ADDRESS
  const daiContractAddress = process.env.REACT_APP_DAI_CONTRACT_ADDRESS

  const connectWalletHandler = async () => {
    if (window.ethereum && window.ethereum.isMetaMask) {
      console.log('MetaMask Here!')

      window.ethereum
        .request({ method: 'eth_requestAccounts' })
        .then((result) => {
          setDefaultAccount(result[0])
          setConnButtonText('Wallet Connected')
          getAccountBalance(result[0])
          getDepositorInfo()
          getBorrowerInfo()
          getLoansInfo()
        })
        .catch((error) => {
          setErrorMessage(error.message)
        })
    } else {
      console.log('Need to install MetaMask')
      setErrorMessage('Please install MetaMask browser extension to interact')
    }
  }

  // update account, will cause reload the page
  const accountChangedHandler = () => {
    window.location.reload()
  }

  const getAccountBalance = (account) => {
    window.ethereum
      .request({ method: 'eth_getBalance', params: [account, 'latest'] })
      .then((balance) => {
        setUserBalance(ethers.utils.formatEther(balance))
      })
      .catch((error) => {
        setErrorMessage(error.message)
      })
  }

  const chainChangedHandler = () => {
    // reload the page to avoid any errors with chain change mid use of application
    window.location.reload()
  }

  // listen for account changes
  window.ethereum.on('accountsChanged', accountChangedHandler)

  window.ethereum.on('chainChanged', chainChangedHandler)

  const getDepositorInfo = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = signer.getAddress()
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    await poolContract.depositors(signerAddress).then((res) => {
      const depositor = {
        totalDepositedAmount: ethers.utils.formatEther(
          res.totalDepositedAmount,
        ),
        totalInterestEarned: ethers.utils.formatEther(res.totalInterestEarned),
      }
      console.log(depositor)
      setDepositor(depositor)
    })
  }

  const getBorrowerInfo = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = signer.getAddress()
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    await poolContract.borrowers(signerAddress).then((res) => {
      const borrower = {
        totalLoanedAmount: ethers.utils.formatEther(res.totalLoanedAmount),
        totalLockedCollateralAmount: ethers.utils.formatEther(
          res.totalLockedCollateralAmount,
        ),
        totalUnlockedCollateralAmount: ethers.utils.formatEther(
          res.totalUnlockedCollateralAmount,
        ),
      }
      console.log(borrower)
      setBorrower(borrower)
    })
  }

  const getLoansInfo = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    const loanIds = await poolContract.getLoanIDs()
    const loans = []
    for (let i = 0; i < loanIds.length; i++) {
      await poolContract.loans(loanIds[i]).then((res) => {
        loans[i] = {
          loanId: res.loanID.toNumber(),
          loanedAmount: ethers.utils.formatEther(res.loanedAmount),
          collateralAmount: ethers.utils.formatEther(res.collateralAmount),
          repayAmount: ethers.utils.formatEther(res.repayAmount),
          loanDuration: res.loanDuration.toNumber(),
          repayed: res.repayed,
        }
      })
    }
    setLoans(loans)
    console.log(loans)
  }

  const updateInterestHandleClick = async (e) => {
    e.preventDefault()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    const tx = await poolContract.calculateDepositorInterest()

    console.log(tx)

    await provider.waitForTransaction(tx.hash)

    getDepositorInfo()
  }

  const depositSubmitHandler = async (e) => {
    e.preventDefault()
    const amount = e.target[0].value
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log('Account:', signerAddress)
    const daiContract = new ethers.Contract(daiContractAddress, daiabi, signer)
    const balance = await daiContract.balanceOf(signerAddress)
    console.log(balance.toString())
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    const tx1 = await daiContract.approve(
      poolContractAddress,
      ethers.utils.parseEther(amount),
    )

    console.log(tx1)

    await provider.waitForTransaction(tx1.hash)

    const tx2 = await poolContract.deposit(ethers.utils.parseEther(amount))

    console.log(tx2)

    await provider.waitForTransaction(tx2.hash)

    window.alert('Deposit success tx: ' + tx2.hash)

    getDepositorInfo()
  }

  const borrowSubmitHandler = async (e) => {
    e.preventDefault()
    const amount = e.target[0].value
    const duration = e.target[1].value
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log('Account:', signerAddress)
    const balance = await provider.getBalance(signerAddress)
    const ethBalance = ethers.utils.formatEther(balance)
    console.log(ethBalance)
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    const pricetuple = await poolContract.getLatestPrice()
    const price = pricetuple[1].toNumber()
    console.log(price)
    const collateral = ((amount * 1.25) / price).toFixed(18)
    const agree = window.confirm('Please pay ' + collateral + ' ETH')
    if (agree) {
      const tx1 = await signer.sendTransaction({
        to: poolContractAddress,
        value: ethers.utils.parseEther(collateral),
      })

      console.log(tx1)

      await provider.waitForTransaction(tx1.hash)

      const tx2 = await poolContract.borrow(
        ethers.utils.parseEther(amount),
        duration,
      )

      console.log(tx2)

      await provider.waitForTransaction(tx2.hash)

      window.alert('Borrow success! tx: ' + tx2.hash)

      getLoansInfo()
    }
  }

  const updateLoanInterest = async (id) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    const tx = await poolContract.calculateloanInterest(id)

    console.log(tx)

    return tx
  }

  const repayHandleClick = async (loanId, e) => {
    e.preventDefault()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log('Account:', signerAddress)

    const daiContract = new ethers.Contract(daiContractAddress, daiabi, signer)
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )

    const tx = await updateLoanInterest(loanId)

    await provider.waitForTransaction(tx.hash)

    await getLoansInfo()

    const loan = await poolContract.loans(loanId)

    const repayAmount = ethers.utils.formatEther(loan.repayAmount)
    console.log(repayAmount)

    const tx1 = await daiContract.approve(
      poolContractAddress,
      ethers.utils.parseEther(repayAmount),
    )

    console.log(tx1)

    await provider.waitForTransaction(tx1.hash)

    const tx2 = await poolContract.repay(loanId)

    console.log(tx2)

    await provider.waitForTransaction(tx2.hash)

    window.alert('Repay success! tx: ' + tx2.hash)

    getLoansInfo()
  }

  const withdrawHandleClick = async (e) => {
    e.preventDefault()
    const amount = e.target[0].value
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log('Account:', signerAddress)
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )
    const tx = await poolContract.withdrawAmount(
      ethers.utils.parseEther(amount),
    )

    console.log(tx)

    await provider.waitForTransaction(tx.hash)

    window.alert('Withdrawal success! tx: ' + tx.hash)

    getDepositorInfo()
  }

  const withdrawInterestHandleClick = async (e) => {
    e.preventDefault()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log('Account:', signerAddress)
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )

    const tx = await poolContract.withdrawInterest()

    console.log(tx)

    await provider.waitForTransaction(tx.hash)

    getDepositorInfo()
  }

  const claimColateralHandleClick = async (e) => {
    e.preventDefault()
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])
    const signer = provider.getSigner()
    const signerAddress = await signer.getAddress()
    console.log('Account:', signerAddress)
    const poolContract = new ethers.Contract(
      poolContractAddress,
      poolabi,
      signer,
    )

    const tx = await poolContract.getBackCollateral()

    console.log(tx)

    await provider.waitForTransaction(tx.hash)

    getBorrowerInfo()
  }

  return (
    <div className="App">
      <h1 className="text-center">DecentraBank</h1>
      <div className="walletCard">
        <button onClick={connectWalletHandler}>{connButtonText}</button>
        <div className="accountDisplay">
          <h3>Address: {defaultAccount}</h3>
        </div>
        <div className="balanceDisplay">
          <h3>Balance (Eth): {userBalance}</h3>
        </div>
        {errorMessage}
      </div>

      {defaultAccount && (
        <div className="container">
          <div className="row">
            <div className="col-sm border">
              <div className="d-flex justify-content-center">
                <b>Deposit DAI</b>
              </div>
              <form onSubmit={depositSubmitHandler}>
                <div className="form-group">
                  <label htmlFor="amount">Deposit amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="amountForDeposit"
                    placeholder="Enter the amount of DAI "
                    required
                  />
                </div>

                <div className="d-flex justify-content-center">
                  <button type="submit" className="btn btn-primary">
                    Deposit
                  </button>
                </div>
              </form>
            </div>

            <div className="col-sm border">
              <div className="d-flex justify-content-center">
                <b>Borrow DAI</b>
              </div>
              <form onSubmit={borrowSubmitHandler}>
                <div className="form-group">
                  <label htmlFor="amount">Borrow amount</label>
                  <input
                    type="number"
                    className="form-control"
                    id="borrowAmount"
                    placeholder="Enter amount of DAI you want to borrow"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="duration">Duration</label>
                  <input
                    type="number"
                    className="form-control"
                    id="borrowDuration"
                    placeholder="Enter duration in days"
                  />
                </div>
                <div className="d-flex justify-content-center">
                  <button type="submit" className="btn btn-primary">
                    Borrow
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <br />

      <div className="container">
        <div className="row">
          <div className="col-sm border">
            <div className="d-flex justify-content-center">
              <b>Depositer Info</b>
            </div>
            {depositor && (
              <div>
                Total Deposited Amount: {depositor.totalDepositedAmount} DAI
                <br />
                Total Interest Earned: {depositor.totalInterestEarned} DAI
                <br />
                <button
                  onClick={updateInterestHandleClick}
                  className="btn btn-primary"
                >
                  Update Interest
                </button>
                <button
                  onClick={withdrawInterestHandleClick}
                  className="btn btn-primary"
                  style={{ float: 'right' }}
                >
                  Withdraw Interest
                </button>
                <form onSubmit={withdrawHandleClick}>
                  <div className="form-group">
                    <label htmlFor="amount">Withdraw amount</label>
                    <input
                      type="number"
                      className="form-control"
                      id="amountForWithdraw"
                      placeholder="Enter the amount of DAI "
                      required
                    />
                  </div>

                  <div className="d-flex justify-content-center">
                    <button type="submit" className="btn btn-primary">
                      Withdraw
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="col-sm border">
            <div className="col-sm border">
              <div className="d-flex justify-content-center">
                <b>Borrower Info</b>
              </div>
              {borrower && (
                <div>
                  Total Loaned Amount: {borrower.totalLoanedAmount} DAI
                  <br />
                  Total Locked Collateral Amount:{' '}
                  {borrower.totalLockedCollateralAmount} Ether
                  <br />
                  Total Unlocked Collateral Amount:{' '}
                  {borrower.totalUnlockedCollateralAmount} Ether
                  <br />
                  {borrower.totalUnlockedCollateralAmount > 0 && (
                    <button
                      onClick={claimColateralHandleClick}
                      className="btn btn-primary "
                      style={{ float: 'right' }}
                    >
                      Claim Collateral
                    </button>
                  )}
                </div>
              )}
            </div>

            <br />
            <div className="d-flex justify-content-center ">
              <b>Loan Info</b>
            </div>
            {loans &&
              loans.map((loan) => (
                <div key={loan.loanId} className="col-sm border">
                  Loan ID: {loan.loanId} <br />
                  Loaned Amount (DAI): {loan.loanedAmount} DAI
                  <br />
                  Loan Duration (Days): {loan.loanDuration} days
                  <br />
                  Repay Amount (DAI): {loan.repayAmount} DAI{' '}
                  {loan.repayed ? '' : '+ Interest'} <br />
                  Status: {loan.repayed ? 'Repayed' : 'Active'}
                  {!loan.repayed && (
                    <div>
                      <button
                        onClick={(e) => repayHandleClick(loan.loanId, e)}
                        className="btn btn-primary"
                      >
                        Repay
                      </button>
                      <br />
                      <br />
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      <br />
    </div>
  )
}

export default Home
