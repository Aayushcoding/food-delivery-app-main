const express=require('express');
const router=express.Router();
const{
getDeliveryAgents,
getDeliveryAgent,
createDeliveryAgent,
updateDeliveryAgent,
deleteDeliveryAgent
}=require('../controllers/deliveryController');

router.get('/',getDeliveryAgents);
router.get('/:id',getDeliveryAgent);
router.post('/',createDeliveryAgent);
router.put('/:id',updateDeliveryAgent);
router.delete('/:id',deleteDeliveryAgent);

module.exports=router;