#!/bin/bash

# Deploys a supabase edge function

source .env
func_name=$1
supabase functions deploy $func_name --project-ref pokkflfmgpbgphcredjk
