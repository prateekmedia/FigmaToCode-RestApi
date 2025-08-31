Container(
  width: 375,
  height: 812,
  clipBehavior: Clip.antiAlias,
  decoration: BoxDecoration(color: Colors.white),
  child: Stack(
    children: [
      Container(
        width: 375,
        height: 44,
        child: Stack(
          children: [
            Container(
              width: 375,
              height: 44,
              padding: const EdgeInsets.only(left: 32, right: 15),
              child: Stack(
                children: [
                  Container(
                    width: 328,
                    height: 11.33,
                    child: Stack(
                      children: [
                        Container(
                          width: 32.02,
                          height: 11.10,
                          child: Stack(),
                        ),
                        Container(
                          width: 66.60,
                          height: 11.33,
                          child: Stack(
                            children: [
                              Container(
                                width: 24.33,
                                height: 11.33,
                                child: Stack(
                                  children: [
                                    Positioned(
                                      left: 0,
                                      top: 0,
                                      child: Container(
                                        width: 22,
                                        height: 11.33,
                                        decoration: ShapeDecoration(
                                          shape: RoundedRectangleBorder(
                                            side: BorderSide(width: 1),
                                            borderRadius: BorderRadius.circular(2.67),
                                          ),
                                        ),
                                      ),
                                    ),
                                    Positioned(
                                      left: 2,
                                      top: 2,
                                      child: Container(
                                        width: 18,
                                        height: 7.33,
                                        decoration: ShapeDecoration(
                                          color: Colors.black,
                                          shape: RoundedRectangleBorder(
                                            borderRadius: BorderRadius.circular(1.33),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      Container(
        width: 375,
        height: 763,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(),
        child: Stack(
          children: [
            Container(
              width: 316,
              height: 710.50,
              child: Stack(
                children: [
                  Container(
                    width: 316,
                    height: 20,
                    child: Stack(
                      children: [
                        Positioned(
                          left: 0,
                          top: 0,
                          child: Text(
                            'Cancel',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 14,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w600,
                              height: 1.43,
                            ),
                          ),
                        ),
                        Container(
                          width: 56,
                          height: 20,
                          child: Stack(
                            children: [
                              Container(width: 20, height: 20, child: Stack()),
                              Container(
                                transform: Matrix4.identity()..translate(0.0, 0.0)..rotateZ(3.14),
                                width: 20,
                                height: 20,
                                child: Stack(),
                              ),
                            ],
                          ),
                        ),
                        Positioned(
                          left: 280.50,
                          top: 0,
                          child: Text(
                            'Done',
                            style: TextStyle(
                              color: Colors.black.withValues(alpha: 0.60),
                              fontSize: 14,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w600,
                              height: 1.43,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 261.94,
                    height: 471.50,
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(),
                    child: Stack(
                      children: [
                        Container(
                          transform: Matrix4.identity()..translate(0.0, 0.0)..rotateZ(1.57),
                          width: 261.94,
                          height: 471.50,
                          clipBehavior: Clip.antiAlias,
                          decoration: BoxDecoration(
                            image: DecorationImage(
                              image: NetworkImage("https://placehold.co/471x262/808080/png"),
                              fit: BoxFit.cover,
                            ),
                          ),
                          child: Stack(),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 300,
                    height: 87,
                    child: Stack(
                      children: [
                        Container(
                          width: 62,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 60,
                                      height: 60,
                                      padding: const EdgeInsets.all(4),
                                      decoration: ShapeDecoration(
                                        color: const Color(0x1408C225),
                                        shape: RoundedRectangleBorder(
                                          side: BorderSide(
                                            width: 1,
                                            color: const Color(0x3308C225),
                                          ),
                                          borderRadius: BorderRadius.circular(119),
                                        ),
                                      ),
                                      child: Stack(
                                        children: [
                                          Positioned(
                                            left: 16,
                                            top: 21.50,
                                            child: Text(
                                              '+60',
                                              style: TextStyle(
                                                color: Colors.black,
                                                fontSize: 14,
                                                fontFamily: 'Inter',
                                                fontWeight: FontWeight.w600,
                                                height: 1.21,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 0,
                                top: 72,
                                child: Text(
                                  'Brightness',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 60,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 5,
                                top: 72,
                                child: Text(
                                  'Contrast',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 60,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(
                                        children: [
                                          Container(
                                            width: 14.29,
                                            height: 18.56,
                                            child: Stack(),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 0,
                                top: 72,
                                child: Text(
                                  'Saturation',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 60,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 3,
                                top: 72,
                                child: Text(
                                  'Exposure',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 60,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 18,
                                top: 72,
                                child: Text(
                                  'Hue',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 74,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 0,
                                top: 72,
                                child: Text(
                                  'Temperature',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 61,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 0,
                                top: 72,
                                child: Text(
                                  'Sharpness',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 63,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 0,
                                top: 72,
                                child: Text(
                                  'Luminance',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          width: 60,
                          height: 87,
                          child: Stack(
                            children: [
                              Container(
                                width: 60,
                                height: 60,
                                padding: const EdgeInsets.all(4),
                                decoration: ShapeDecoration(
                                  color: const Color(0xFFF5F5F5),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(119),
                                  ),
                                ),
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 24,
                                      height: 24,
                                      clipBehavior: Clip.antiAlias,
                                      decoration: BoxDecoration(),
                                      child: Stack(),
                                    ),
                                  ],
                                ),
                              ),
                              Positioned(
                                left: 15.50,
                                top: 72,
                                child: Text(
                                  'Fade',
                                  style: TextStyle(
                                    color: Colors.black,
                                    fontSize: 12,
                                    fontFamily: 'Inter',
                                    fontWeight: FontWeight.w500,
                                    height: 1.25,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 303,
                    height: 36,
                    decoration: ShapeDecoration(
                      color: Colors.black.withValues(alpha: 0.04),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(84),
                      ),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          left: 12,
                          top: 16,
                          child: Container(
                            width: 4,
                            height: 4,
                            decoration: ShapeDecoration(
                              color: Colors.black.withValues(alpha: 0.30),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(5.43),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 57,
                          top: 6,
                          child: Container(
                            width: 106,
                            height: 24,
                            decoration: ShapeDecoration(
                              color: const Color(0xFF08C225),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(32.57),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 57,
                          top: 6,
                          child: Container(
                            width: 106,
                            height: 24,
                            decoration: ShapeDecoration(
                              color: const Color(0xFF08C225),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(32.57),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 50,
                          top: 6,
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: ShapeDecoration(
                              color: const Color(0xFF08C225),
                              shape: RoundedRectangleBorder(
                                side: BorderSide(
                                  width: 2.40,
                                  strokeAlign: BorderSide.strokeAlignOutside,
                                  color: Colors.white,
                                ),
                                borderRadius: BorderRadius.circular(39.09),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 148,
                          top: 16,
                          child: Container(
                            width: 4,
                            height: 4,
                            decoration: ShapeDecoration(
                              color: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(5.43),
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 287,
                          top: 16,
                          child: Container(
                            width: 4,
                            height: 4,
                            decoration: ShapeDecoration(
                              color: Colors.black.withValues(alpha: 0.30),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(5.43),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    ],
  ),
)