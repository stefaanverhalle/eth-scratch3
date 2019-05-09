const log = require('minilog')('eth-scratch3:TokenSimple')
const VError = require('verror')

const TokenContract = require('../contracts/TokenSimple.json')

class TokenSimple {

    constructor(options = {}) {

        if (typeof web3 === 'undefined') {
            log.warn('MetaMask is not installed so will load web3 locally')
            Web3 = require('web3')
            const config = require('../config.js')
            this.web3Client = new Web3(new Web3.providers.HttpProvider(`https://ropsten.infura.io/v3/${config.infuraProjectId}`))
        }
        else {
            // ethereum.enable()
            if (web3 && web3.version) {
                log.debug(`Using injected web3 version ${web3.version.api} and selected address ${web3.selectedAddress}`)
            }
            else {
                log.error(`Could not get version of injected web3`)
            }

            this.web3Client = new Web3(web3.currentProvider)
        }

        this.setContract(options)
    }

    setContract(options)
    {
        this.network = options.network || 3 // default to the Ropsten network
        this.contractAddress = options.contractAddress || TokenContract.networks[this.network].address

        this.tokenContract = this.web3Client.eth.contract(TokenContract.abi).at(this.contractAddress)

        log.debug(`Token contract address ${this.contractAddress} for network ${this.network}`)
    }

    deploy(params, description)
    {
        return new Promise((resolve, reject) => {

            const deployDescription = `${description} to network with id ${web3.version.network} with params ${JSON.stringify(params)}`

            log.debug(`About to ${deployDescription}`)

            this.tokenContract = web3.eth.contract(TokenContract.abi)

            this.tokenContract.new(
                ...params,
                {data: TokenContract.bytecode},
                (err, contract) =>
            {
                if(err) {
                    const error = new VError(err, `Failed to ${deployDescription}.`)
                    log.error(error.message)
                    return reject(error)
                }

                if(!contract.address) {
                    log.info(`Got transaction hash ${contract.transactionHash} for ${deployDescription}`)
                }
                else {
                    this.setContract({
                        contractAddress: contract.address,
                        network: web3.version.network
                    })

                    resolve(contract.address)
                }
            })
        })
    }

    send(methodName, args, description)
    {
        return new Promise((resolve, reject) => {

            const sendDescription = `${description} using contract with address ${this.contractAddress}`

            log.debug(`About to ${sendDescription}`)

            this.tokenContract[methodName].sendTransaction(...args, (err, transactionHash) =>
            {
                if(err) {
                    const error = new VError(err, `Failed to ${sendDescription}.`)
                    log.error(error.message)
                    return reject(error)
                }

                log.info(`Got transaction hash ${transactionHash} for ${sendDescription}`)

                resolve(transactionHash)
            })
        })
    }

    call(methodName, args, description)
    {
        return new Promise((resolve, reject) => {

            const callDescription = `${description} using contract with address ${this.contractAddress}`

            log.debug(`About to ${callDescription}`)

            this.tokenContract[methodName](...args, (err, returnedValue) =>
            {
                if(err) {
                    const error = new VError(err, `Failed to ${callDescription}.`)
                    log.error(error.message)
                    return reject(error)
                }

                log.info(`Got ${returnedValue} from ${callDescription}`)

                resolve(returnedValue)
            })
        })
    }
}

module.exports = TokenSimple