require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 4000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ls3lx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const jobCollactions = client.db('jobhanter').collection('job')
    const jobsApplyCollactions = client.db('jobhanter').collection('job-application')

    app.get('/job', async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email }
      }
      const cursor = jobCollactions.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    // get id 
    app.get('/jobs/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await jobCollactions.findOne(filter)
      res.send(result)
    })
    // app.post include in the client site added data
    app.post('/job', async (req, res) => {
      const query = req.body;
      const result = await jobCollactions.insertOne(query);
      res.send(result)
    })

    //job applycation list 
    app.get('/job-applications', async (req, res) => {
      const email = req.query.email;
      const query = { applycant_email: email }
      const result = await jobsApplyCollactions.find(query).toArray()

      for (const application of result) {
        const query = { _id: new ObjectId(application.job_id) }
        const job = await jobCollactions.findOne(query);
        
        if (job) {
          application.title = job.title,
            application.company = job.company
          application.category = job.category
          application.company_logo = job.company_logo
          application.description = job.description
          application.location = job.location
          application.requirements = job.requirements
          application.salaryRange = job.salaryRange
        }
      }

      res.send(result)
    })
    app.get('/job-applications/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const result = await jobsApplyCollactions.findOne(filter)
      res.send(result)
    })


    app.post('/job-applications', async (req, res) => {
      const application = req.body;
      const result = await jobsApplyCollactions.insertOne(application)

      //count methoude
      const id = application.job_id;
      const query = { _id: new ObjectId(id) };
      const job = await jobCollactions.findOne(query)
      console.log(job);
      let newCount = 0;
      if (job.applicationCount) {
        newCount = job.applicationCount + 1;
      } else {
        newCount = 1;
      }
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set:{
          applicationCount : newCount
        }
      }
      const updateResult = await jobCollactions.updateOne(filter, updateDoc)
      res.send(result)
    })
    // delete my application jobs 

    app.delete('/job-applications/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await jobsApplyCollactions.deleteOne(filter);
      res.send(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('the job portal haven')
})

app.listen(port, () => {
  console.log(`this is a job portal : ${port}`);
})