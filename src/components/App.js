import React, { Component } from 'react';
import './App.css';
import Web3 from 'web3';
import Navbar from './Navbar';
import SocialNetwork from '../abis/SocialNetwork.json';
import Main from './Main';

class App extends Component {
  // first this happens
  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  // takes the connection from metamask and fix this in the code
  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  }
  
  async loadBlockchainData(){
   
   const web3 = window.web3;
   // load accounts
   const accounts = await web3.eth.getAccounts() 
   this.setState({account:accounts[0]})
   // in order to get address we need network id
   const networkId = await web3.eth.net.getId();
   const networkData = SocialNetwork.networks[networkId];
   // address
   if(networkData){
      const socialNetwork = web3.eth.Contract(SocialNetwork.abi,networkData.address);
      this.setState({socialNetwork});
      const postCount = await socialNetwork.methods.postCount().call();
      this.setState({postCount});
      console.log(postCount);
      // load posts
      for(var i = 1;i<= postCount;i++){
        const post = await socialNetwork.methods.posts(i).call();
        this.setState({posts : [...this.state.posts,post]});
      }
      this.setState({
        posts:this.state.posts.sort((a,b)=>{
          return b.tipAmount-a.tipAmount
        })
      })
      this.setState({loading:false})
   }else{
      window.alert('socila network not deplyed to the blockchain')
   }
   // abi
  }

  createPost(content){
    this.setState({loading : true})
    this.state.socialNetwork.methods.createPost(content).send({from :this.state.account})
    .once('reciept',(reciept)=>{
      this.setState({loading : false});
    }) 
  }

  tipPost(id,tipAmount){
    this.setState({loading:true});
    this.state.socialNetwork.methods.tipPost(id).send({from : this.state.account, value:tipAmount})
    .once('reciept',(reciept)=>{
    this.setState({loading : false})
    })

  }

  constructor(props){
    super(props);
    this.state={
      account:'',
      socialNetwork: null,
      postCount: 0,
      posts:[],
      loading:true
    }
    this.createPost = this.createPost.bind(this)
    this.tipPost = this.tipPost.bind(this)
  }

  render() {
    return (
      <div>
        <Navbar account ={this.state.account} />
        {
        this.state.loading
        ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
        :<Main createPost={this.createPost} posts = {this.state.posts} 
         tipPost = {this.tipPost}
        />
        }
      </div>
    );
  }
}

export default App;
