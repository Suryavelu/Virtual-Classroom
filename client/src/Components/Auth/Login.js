import { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import GoogleLogin from 'react-google-login'
import GoogleButton from 'react-google-button'
import { Link } from 'react-router-dom'
import { useCookies } from 'react-cookie';


const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [cookies, setCookie] = useCookies(['user']);
    const [icon, seticon] = useState('visibility_off')
    const textinput = useRef(null);
    const history = useHistory();
    function handleclick() {
        if (textinput.current.type === "password") {
            textinput.current.type = "text"
            seticon('visibility')
        }
        else {
            textinput.current.type = "password"
            seticon('visibility_off')
        }

    }
    const handlesubmit = (e) => {
        e.preventDefault()
        if (username === '' || password === '') {
            alert("Kindly enter valid details..")
        }
        else {
            const a = { username, password }
            fetch("/login", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(a)
            })
                .then((res) => {
                    return res.json();
                })
                .then((data) => {
                    console.log("data", data)
                    if (data.success && data.teacher) {
                        setCookie('email', username, { path: '/' });
                        history.push("/teacherdashboard")
                    }
                    else if (data.success && data.student) {
                        setCookie('email', username, { path: '/' });
                        history.push("/studentdashboard")
                    }
                    else {
                        alert("Invalid username or password")
                    }
                    /*if (data["id"] === null) {
                        history.push('/signup')
                    }
                    else {
                        history.push(`/user/${data["id"]}/dashboard`);
    
                    }*/

                })
        }
    }
    const Google = (response) => {
        console.log(response.profileObj)
        console.log(response)
        let a = {
            "username": response.profileObj.email,
            "password": response.profileObj.googleId
        }

        fetch("/login", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(a)
        })
            .then((res) => {
                return res.json();
            })
            .then((data) => {
                if (data.success && data.teacher) {
                    setCookie('email', response.profileObj.email, { path: '/' });
                    history.push("/teacherdashboard")
                }
                else if (data.success && data.student) {
                    setCookie('email', response.profileObj.email, { path: '/' });
                    history.push("/studentdashboard")
                }
                else {
                    alert("Invalid username or password")
                }
                //console.log("data",data)
                /*if (data["id"] === null) {
                    history.push('/signup')
                }
                else {
                    history.push(`/user/${data["id"]}/dashboard`);
                }*/

            })
    }

    return (
        <div id="form-boot-con" className="d-flex align-items-center" >
            <Container>
                <Row className="justify-content-center">
                    <Col lg={6}>
                        <Form onSubmit={handlesubmit}>
                            <Form.Group className="mb-3" controlId="formBasicEmail">
                                <Form.Label id="bt-main-form-lb">Email</Form.Label>
                                <Form.Control type="email" value={username} onChange={(e) => { setUsername(e.target.value) }} placeholder="email" />

                            </Form.Group>

                            <Form.Group className="mb-3" controlId="formBasicPassword">
                                <Form.Label id="bt-main-form-lb">Password</Form.Label>
                                <i><span className="material-icons" style={{ float: 'right' }} onClick={handleclick}>{icon}</span></i>
                                <Form.Control type="password" placeholder="Password" ref={textinput} value={password} onChange={(e) => { setPassword(e.target.value) }} />
                            </Form.Group>

                            <Button variant="outline-dark" type="submit">
                                Log in
                            </Button>

                        </Form>
                        <p style={{ marginTop: '25px' }}><strong>Don't have an account ? <Link to='/signup' style={{ color: 'white' }}>Signup</Link></strong></p>
                        <Row style={{ marginTop: '25px', marginBottom: '25px' }}>
                            <Col lg={12}>
                                <hr style={{ backgroundColor: "gray" }} />
                            </Col>


                        </Row>
                        <Row>
                            <Col lg={12} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>

                                <GoogleLogin
                                    buttonText='log in with Google'
                                    render={renderProps => (
                                        <GoogleButton onClick={renderProps.onClick} disabled={renderProps.disabled}></GoogleButton>
                                    )}

                                    onSuccess={Google}
                                    onFailure={Google}
                                    cookiePolicy={'single_host_origin'}
                                    clientId="192693958580-o2h1mdptuv2ui7vg1qcilo3tgoqaqlcg.apps.googleusercontent.com"
                                />


                            </Col>



                        </Row>

                    </Col>

                </Row>

            </Container>



        </div>




    );
}

export default Login;
