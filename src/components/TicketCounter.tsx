/** @format */

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contract ABI & Address (Replace with your contract details)
const CONTRACT_ADDRESS = '0xYourContractAddress';
const USDT_ADDRESS = '0xYourUSDTTokenAddress'; // USDT Contract on BNB Chain

const LOTTERY_ABI = [
	'function buyTicket(uint8[5] numbers) public',
	'function winningNumbers(uint256 id) public view returns (uint8[5][])',
	'function claimPrize() public',
	'function lotteryId() public view returns (uint256)',
];

function LotteryApp() {
	const [account, setAccount] = useState(null);
	const [provider, setProvider] = useState(null);
	const [contract, setContract] = useState(null);
	const [winningNumbers, setWinningNumbers] = useState([]);
	const [ticketNumbers, setTicketNumbers] = useState([1, 2, 3, 4, 5]);

	useEffect(() => {
		loadBlockchainData();
	}, []);

	async function loadBlockchainData() {
		if (window.ethereum) {
			const provider = new ethers.providers.Web3Provider(window.ethereum);
			const signer = provider.getSigner();
			const contract = new ethers.Contract(
				CONTRACT_ADDRESS,
				LOTTERY_ABI,
				signer
			);

			setProvider(provider);
			setContract(contract);

			const accounts = await provider.send('eth_requestAccounts', []);
			setAccount(accounts[0]);

			toast.success('Connected to MetaMask!');
		} else {
			toast.error('MetaMask not installed!');
		}
	}

	async function buyTicket() {
		if (!contract) return toast.error('Contract not loaded');

		try {
			const usdtContract = new ethers.Contract(
				USDT_ADDRESS,
				[
					'function approve(address spender, uint256 amount) public returns (bool)',
				],
				provider.getSigner()
			);

			const ticketPrice = ethers.utils.parseUnits('10', 18); // 10 USDT

			// Approve USDT spending
			const approveTx = await usdtContract.approve(
				CONTRACT_ADDRESS,
				ticketPrice
			);
			await approveTx.wait();

			// Buy Ticket
			const tx = await contract.buyTicket(ticketNumbers);
			await tx.wait();

			toast.success('Ticket Purchased!');
		} catch (error) {
			console.error(error);
			toast.error('Transaction failed!');
		}
	}

	async function checkWinningNumbers() {
		if (!contract) return toast.error('Contract not loaded');

		try {
			const numbers = await contract.winningNumbers(
				(await contract.lotteryId()) - 1
			);
			setWinningNumbers(numbers.map((num) => num.toString()));

			toast.info('Winning numbers fetched!');
		} catch (error) {
			console.error(error);
			toast.error('Failed to fetch winning numbers.');
		}
	}

	async function claimPrize() {
		if (!contract) return toast.error('Contract not loaded');

		try {
			const tx = await contract.claimPrize();
			await tx.wait();

			toast.success('Prize Claimed!');
		} catch (error) {
			console.error(error);
			toast.error('No winnings or already claimed!');
		}
	}

	return (
		<div className='container'>
			<h1>BNB Chain Lottery</h1>

			<button onClick={loadBlockchainData}>Connect Wallet</button>
			{account && <p>Connected: {account}</p>}

			<div>
				<h3>Pick Your Numbers:</h3>
				{ticketNumbers.map((num, i) => (
					<input
						key={i}
						type='number'
						min='1'
						max='50'
						value={num}
						onChange={(e) => {
							const newNumbers = [...ticketNumbers];
							newNumbers[i] = Number(e.target.value);
							setTicketNumbers(newNumbers);
						}}
					/>
				))}
				<button onClick={buyTicket}>Buy Ticket (10 USDT)</button>
			</div>

			<div>
				<h3>Winning Numbers: {winningNumbers.join(', ') || 'Not Drawn Yet'}</h3>
				<button onClick={checkWinningNumbers}>Check Winning Numbers</button>
			</div>

			<div>
				<button onClick={claimPrize}>Claim Prize</button>
			</div>
		</div>
	);
}

export default LotteryApp;
