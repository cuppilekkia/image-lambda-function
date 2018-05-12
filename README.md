**Image Resize service**
---

Services:
--
- Lambda function
- API Gateway


This service requires an S3 Bucket as a source of images, set as Static Hosting, with the following 

bucket policy:
-
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AddPerm",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::BUCKET_NAME/*"
        }
    ]
}
```

redirect rule:
-
```
<RoutingRules>
  <RoutingRule>
    <Condition>
      <KeyPrefixEquals/>
      <HttpErrorCodeReturnedEquals>404</HttpErrorCodeReturnedEquals>
    </Condition>
    <Redirect>
      <Protocol>https</Protocol>
      <HostName>API_GATEWAY_HOSTNAME</HostName>
      <ReplaceKeyPrefixWith>prod/resize?key=</ReplaceKeyPrefixWith>
      <HttpRedirectCode>307</HttpRedirectCode>
    </Redirect>
  </RoutingRule>
</RoutingRules>
```

ENV variables for BUCKET_NAME and URL are currently saved in the `function-template.yaml`

---
The image is requested in the folder on S3 that contains the resized copy like:

`path-to-image/s200x100/image.[jpg|webp]`

The original image must be in the parent folder like:

`path-to-image/image.jpg`

--

The 'resize' folder can have the following pattern:
- **s**200x100 (resize and crop with provided width and height)
- **w**200 (resize to provided width, keep ratio)
- **h**200 (resize to provided height, keep ratio)

--

Provess:

The file is requested to S3, when that size is not available the request gets redirected to the API gateway which fires the lambda function associated to perform the resize/crop/format on the original image. 

*If a WEBP format is requested, the file will be generated always from the original JPG version and saved for further requests.*

Then the new file is saved in the correct folder into the S3 bucket itself and returned to the user.

---

TODO:
-
- Complete the docs including the process to package/deploy the stack
- Build a pipeline to CI/CD