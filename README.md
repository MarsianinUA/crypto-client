# crypto-client  
Implemented client data encryption module.  
Payload is written to JSON file  

## Input data
```
    {
    name: 'Pitter Black',
    email: 'pblack@email.com',
    password: 'pblack_123'
    }
```

## Output data
```
    DB Log: {
    source: 'Guardian',
    payload: {
        name: 'Pitter Black',
        email: '70626c61636b40656d61696c2e636f6d',
        password: '70626c61636b5f313233'
    },
    created: 2025-02-16T09:58:54.001Z
    }
```